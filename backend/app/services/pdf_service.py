# app/services/pdf_service.py
"""Professional PDF generation service for Big Five Personality Assessment reports."""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Wedge, Line
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from io import BytesIO
from typing import Dict, Any, List
from datetime import datetime
from scipy import stats
import re


class PDFService:
    """Professional PDF report generator for personality assessments."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
        # Professional color palette
        self.colors = {
            'primary': colors.HexColor('#1e40af'),      # Deep blue
            'secondary': colors.HexColor('#3b82f6'),    # Bright blue
            'accent': colors.HexColor('#0ea5e9'),       # Sky blue
            'dark': colors.HexColor('#0f172a'),         # Slate 900
            'text': colors.HexColor('#334155'),         # Slate 700
            'muted': colors.HexColor('#64748b'),        # Slate 500
            'light': colors.HexColor('#f1f5f9'),        # Slate 100
            'border': colors.HexColor('#e2e8f0'),       # Slate 200
            'success': colors.HexColor('#22c55e'),      # Green
            'warning': colors.HexColor('#d97706'),      # Amber
        }
        
        # Trait colors (professional palette)
        self.trait_colors = {
            'extraversion': colors.HexColor('#dc2626'),       # Red
            'agreeableness': colors.HexColor('#16a34a'),      # Green
            'conscientiousness': colors.HexColor('#2563eb'),  # Blue
            'neuroticism': colors.HexColor('#d97706'),        # Amber
            'openness': colors.HexColor('#7c3aed')            # Purple
        }
        
        self.trait_labels = {
            'extraversion': 'Extraversion',
            'agreeableness': 'Agreeableness', 
            'conscientiousness': 'Conscientiousness',
            'neuroticism': 'Neuroticism',
            'openness': 'Openness'
        }
        
        # Population norms for score calculation
        self.norms = {
            'extraversion': {'mean': 27.1, 'std': 6.0},
            'agreeableness': {'mean': 33.3, 'std': 5.2},
            'conscientiousness': {'mean': 32.6, 'std': 5.8},
            'neuroticism': {'mean': 21.8, 'std': 6.5},
            'openness': {'mean': 35.4, 'std': 5.7}
        }
    
    def _setup_custom_styles(self):
        """Setup professional custom paragraph styles."""
        # Main title
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=self.styles['Title'],
            fontSize=26,
            spaceAfter=8,
            textColor=colors.HexColor('#0f172a'),
            fontName='Helvetica-Bold',
            alignment=TA_CENTER
        ))
        
        # Subtitle
        self.styles.add(ParagraphStyle(
            name='ReportSubtitle',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=20,
            textColor=colors.HexColor('#64748b'),
            alignment=TA_CENTER
        ))
        
        # Section headers
        self.styles.add(ParagraphStyle(
            name='SectionTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceBefore=25,
            spaceAfter=12,
            textColor=colors.HexColor('#1e40af'),
            fontName='Helvetica-Bold',
            borderPadding=8,
            leftIndent=0
        ))
        
        # Subsection headers
        self.styles.add(ParagraphStyle(
            name='SubsectionTitle',
            parent=self.styles['Heading2'],
            fontSize=13,
            spaceBefore=15,
            spaceAfter=8,
            textColor=colors.HexColor('#334155'),
            fontName='Helvetica-Bold'
        ))
        
        # Body text
        self.styles.add(ParagraphStyle(
            name='ReportBodyText',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=15,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor('#334155'),
            spaceAfter=8
        ))
        
        # Bullet points
        self.styles.add(ParagraphStyle(
            name='BulletText',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155'),
            leftIndent=15,
            bulletIndent=5,
            spaceAfter=4
        ))
        
        # Trait name style
        self.styles.add(ParagraphStyle(
            name='TraitTitle',
            parent=self.styles['Normal'],
            fontSize=12,
            fontName='Helvetica-Bold',
            spaceAfter=4,
            textColor=colors.HexColor('#1e293b')
        ))
        
        # Score value style
        self.styles.add(ParagraphStyle(
            name='ScoreValue',
            parent=self.styles['Normal'],
            fontSize=11,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#2563eb')
        ))
        
        # Description style
        self.styles.add(ParagraphStyle(
            name='Description',
            parent=self.styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=10
        ))
        
        # Footer style
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#94a3b8'),
            alignment=TA_CENTER
        ))
        
        # Guidance content style
        self.styles.add(ParagraphStyle(
            name='GuidanceText',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#374151'),
            spaceAfter=6
        ))
        
        # Guidance header style
        self.styles.add(ParagraphStyle(
            name='GuidanceHeader',
            parent=self.styles['Normal'],
            fontSize=12,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#1e40af'),
            spaceBefore=12,
            spaceAfter=6
        ))

    def _calculate_scores(self, raw_scores: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Calculate percentiles and interpretations from raw scores."""
        calculated = {}
        
        for trait, data in raw_scores.items():
            raw_score = data.get('rawScore', 0) if isinstance(data, dict) else data
            norm = self.norms.get(trait, {'mean': 30, 'std': 5})
            
            # Calculate z-score and percentile
            z_score = (raw_score - norm['mean']) / norm['std'] if norm['std'] != 0 else 0
            percentile = round(stats.norm.cdf(z_score) * 100, 1)
            t_score = round(50 + (10 * z_score), 1)
            
            # Determine interpretation
            if percentile >= 80:
                interpretation = "Very High"
            elif percentile >= 60:
                interpretation = "High"
            elif percentile >= 40:
                interpretation = "Average"
            elif percentile >= 20:
                interpretation = "Low"
            else:
                interpretation = "Very Low"
            
            calculated[trait] = {
                'name': self.trait_labels.get(trait, trait.capitalize()),
                'rawScore': raw_score,
                'maxScore': 50,
                'percentile': percentile,
                'tScore': t_score,
                'interpretation': interpretation
            }
        
        return calculated

    def _create_cover_page(self, user_data: Dict[str, Any], session_data: Dict[str, Any]) -> List:
        """Create professional cover page."""
        elements = []
        
        # Add top spacing
        elements.append(Spacer(1, 60))
        
        # Main title with decorative line
        elements.append(Paragraph(
            "PERSONALITY ASSESSMENT REPORT",
            self.styles['ReportTitle']
        ))
        
        # Decorative line
        drawing = Drawing(400, 4)
        drawing.add(Line(50, 2, 350, 2, strokeColor=self.colors['primary'], strokeWidth=2))
        elements.append(drawing)
        elements.append(Spacer(1, 8))
        
        # Subtitle
        elements.append(Paragraph(
            "Big Five Personality Inventory (IPIP-50)",
            self.styles['ReportSubtitle']
        ))
        
        elements.append(Spacer(1, 50))
        
        # Participant info card
        name = user_data.get('name', 'Anonymous')
        age = user_data.get('age', 'N/A')
        country = user_data.get('country', 'N/A')
        university = user_data.get('university', '') or 'N/A'
        
        # Calculate duration
        duration_sec = session_data.get('totalDurationSec', 0) if session_data else 0
        duration_min = round(duration_sec / 60, 1)
        completed_at = session_data.get('completedAt', datetime.now().isoformat()) if session_data else datetime.now().isoformat()
        
        try:
            completed_date = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
            date_str = completed_date.strftime("%B %d, %Y")
        except:
            date_str = datetime.now().strftime("%B %d, %Y")
        
        # Create participant info table
        info_data = [
            ['PREPARED FOR'],
            [name],
            [''],
            ['Age', str(age), 'Country', country],
            ['University/Organization', university, '', ''],
            ['Assessment Date', date_str, 'Duration', f'{duration_min} minutes'],
        ]
        
        info_table = Table(info_data, colWidths=[1.5*inch, 1.5*inch, 1.2*inch, 1.5*inch])
        info_table.setStyle(TableStyle([
            # Header row
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('TEXTCOLOR', (0, 0), (-1, 0), self.colors['muted']),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('SPAN', (0, 0), (-1, 0)),
            
            # Name row
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 22),
            ('TEXTCOLOR', (0, 1), (-1, 1), self.colors['dark']),
            ('ALIGN', (0, 1), (-1, 1), 'CENTER'),
            ('SPAN', (0, 1), (-1, 1)),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 15),
            
            # Spacer row
            ('SPAN', (0, 2), (-1, 2)),
            
            # Data rows
            ('FONTNAME', (0, 3), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 3), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 3), (-1, -1), 10),
            ('TEXTCOLOR', (0, 3), (0, -1), self.colors['muted']),
            ('TEXTCOLOR', (2, 3), (2, -1), self.colors['muted']),
            ('TEXTCOLOR', (1, 3), (1, -1), self.colors['dark']),
            ('TEXTCOLOR', (3, 3), (3, -1), self.colors['dark']),
            ('TOPPADDING', (0, 3), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 3), (-1, -1), 8),
            
            # University span
            ('SPAN', (1, 4), (3, 4)),
            
            # Overall styling
            ('BACKGROUND', (0, 0), (-1, -1), self.colors['light']),
            ('BOX', (0, 0), (-1, -1), 1, self.colors['border']),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 60))
        
        # About this report box
        about_text = (
            "This report presents a comprehensive analysis of personality traits based on the "
            "Big Five personality model, the most widely accepted and scientifically validated "
            "framework in personality psychology. The assessment measures five core dimensions: "
            "Extraversion, Agreeableness, Conscientiousness, Neuroticism, and Openness to Experience."
        )
        
        elements.append(Paragraph("<b>About This Report</b>", self.styles['SubsectionTitle']))
        elements.append(Paragraph(about_text, self.styles['ReportBodyText']))
        
        elements.append(Spacer(1, 30))
        
        # Confidentiality notice
        elements.append(Paragraph(
            "<b>CONFIDENTIAL</b> - This document contains personal assessment results "
            "intended for professional and personal development purposes.",
            self.styles['Description']
        ))
        
        elements.append(PageBreak())
        return elements

    def _create_trait_pie_chart(self, trait_name: str, percentile: float, color: colors.Color) -> Drawing:
        """Create a professional pie chart for a single trait."""
        drawing = Drawing(120, 120)
        
        # Background circle (remaining percentage)
        remaining = max(0, 100 - percentile)
        
        # Create pie chart
        pie = Pie()
        pie.x = 35
        pie.y = 10
        pie.width = 80
        pie.height = 80
        pie.data = [percentile, remaining]
        pie.labels = None
        pie.slices[0].fillColor = color
        pie.slices[0].strokeWidth = 0
        pie.slices[1].fillColor = colors.HexColor('#e5e7eb')
        pie.slices[1].strokeWidth = 0
        pie.startAngle = 90
        
        drawing.add(pie)
        
        # Add percentage text in center
        drawing.add(String(75, 45, f"{percentile:.0f}%", 
                          fontSize=14, fontName='Helvetica-Bold',
                          fillColor=color, textAnchor='middle'))
        
        # Add trait initial
        initial = trait_name[0].upper()
        drawing.add(String(75, 105, initial,
                          fontSize=11, fontName='Helvetica-Bold',
                          fillColor=self.colors['text'], textAnchor='middle'))
        
        return drawing

    def _create_overview_section(self, traits: Dict[str, Dict[str, Any]]) -> List:
        """Create personality overview with pie charts."""
        elements = []
        
        elements.append(Paragraph("Executive Summary", self.styles['SectionTitle']))
        
        elements.append(Paragraph(
            "The following charts display your percentile scores across the five major personality dimensions. "
            "Percentile scores indicate how you compare to the general population - for example, a score of 75 means "
            "you scored higher than 75% of people.",
            self.styles['ReportBodyText']
        ))
        
        elements.append(Spacer(1, 20))
        
        # Create pie charts row
        trait_order = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness']
        charts = []
        
        for trait in trait_order:
            trait_data = traits.get(trait, {})
            percentile = trait_data.get('percentile', 50)
            color = self.trait_colors.get(trait, self.colors['primary'])
            chart = self._create_trait_pie_chart(trait, percentile, color)
            charts.append(chart)
        
        # Charts table
        charts_row = [[c for c in charts]]
        charts_table = Table(charts_row, colWidths=[1.4*inch]*5)
        charts_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(charts_table)
        
        # Labels row
        labels = [[self.trait_labels.get(t, t.capitalize()) for t in trait_order]]
        labels_table = Table(labels, colWidths=[1.4*inch]*5)
        labels_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), self.colors['text']),
        ]))
        elements.append(labels_table)
        
        elements.append(Spacer(1, 25))
        
        # Summary bar chart
        elements.append(Paragraph("Comparative Overview", self.styles['SubsectionTitle']))
        
        drawing = Drawing(480, 160)
        chart = VerticalBarChart()
        chart.x = 60
        chart.y = 30
        chart.width = 380
        chart.height = 110
        
        percentiles = [traits.get(t, {}).get('percentile', 50) for t in trait_order]
        chart.data = [percentiles]
        chart.categoryAxis.categoryNames = ['E', 'A', 'C', 'N', 'O']
        chart.categoryAxis.labels.fontName = 'Helvetica-Bold'
        chart.categoryAxis.labels.fontSize = 11
        
        chart.valueAxis.valueMin = 0
        chart.valueAxis.valueMax = 100
        chart.valueAxis.valueStep = 25
        chart.valueAxis.labels.fontSize = 9
        
        # Apply trait colors to bars
        for i, trait in enumerate(trait_order):
            chart.bars[0].fillColor = self.trait_colors.get(trait, self.colors['primary'])
        
        chart.bars.strokeWidth = 0
        chart.barWidth = 45
        
        # Add reference lines
        drawing.add(Line(60, 85, 440, 85, strokeColor=self.colors['border'], strokeWidth=0.5, strokeDashArray=[3,3]))
        drawing.add(String(448, 82, "50%", fontSize=8, fillColor=self.colors['muted']))
        
        drawing.add(chart)
        elements.append(drawing)
        
        # Legend
        legend_text = "E = Extraversion | A = Agreeableness | C = Conscientiousness | N = Neuroticism | O = Openness"
        elements.append(Paragraph(f"<i>{legend_text}</i>", self.styles['Description']))
        
        return elements

    def _create_detailed_traits_section(self, traits: Dict[str, Dict[str, Any]]) -> List:
        """Create detailed trait analysis section."""
        elements = []
        
        elements.append(Paragraph("Detailed Trait Analysis", self.styles['SectionTitle']))
        
        trait_descriptions = {
            'extraversion': {
                'desc': "Measures your tendency to seek stimulation and engage with the external world.",
                'high': "You are outgoing, energetic, and thrive in social situations. You naturally take initiative and enjoy being the center of attention.",
                'average': "You balance social engagement with personal time. You can be outgoing when needed but also value solitude.",
                'low': "You prefer quieter, more solitary activities. You think before speaking and prefer deeper one-on-one connections."
            },
            'agreeableness': {
                'desc': "Measures your tendency toward compassion, cooperation, and social harmony.",
                'high': "You are cooperative, trusting, and prioritize others' needs. You excel at building harmonious relationships.",
                'average': "You balance cooperation with self-interest. You can be trusting while maintaining healthy skepticism.",
                'low': "You are direct, competitive, and prioritize efficiency over harmony. You're comfortable challenging others."
            },
            'conscientiousness': {
                'desc': "Measures your tendency toward organization, dependability, and goal-directed behavior.",
                'high': "You are highly organized, disciplined, and reliable. You plan ahead and follow through on commitments.",
                'average': "You balance structure with flexibility. You can be organized when needed while adapting to change.",
                'low': "You prefer spontaneity and flexibility over rigid planning. You adapt quickly to changing circumstances."
            },
            'neuroticism': {
                'desc': "Measures your tendency to experience negative emotions and emotional instability.",
                'high': "You experience emotions intensely and may be sensitive to stress. You're highly attuned to potential problems.",
                'average': "You have typical emotional responses. You manage stress reasonably well in most situations.",
                'low': "You are emotionally stable and resilient. You remain calm under pressure and recover quickly from setbacks."
            },
            'openness': {
                'desc': "Measures your appreciation for art, emotion, adventure, and intellectual curiosity.",
                'high': "You are creative, curious, and open to new experiences. You appreciate art, ideas, and unconventional thinking.",
                'average': "You balance creativity with practicality. You appreciate new ideas while valuing proven approaches.",
                'low': "You prefer routine, familiarity, and practical solutions. You focus on concrete facts over abstract ideas."
            }
        }
        
        for trait_key in ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness']:
            trait_data = traits.get(trait_key, {})
            trait_name = trait_data.get('name', trait_key.capitalize())
            percentile = trait_data.get('percentile', 50)
            t_score = trait_data.get('tScore', 50)
            raw_score = trait_data.get('rawScore', 0)
            interpretation = trait_data.get('interpretation', 'Average')
            color = self.trait_colors.get(trait_key, self.colors['primary'])
            
            # Trait header with color accent
            elements.append(Spacer(1, 10))
            
            # Create trait card
            header_data = [[
                Paragraph(f"<font color='{color.hexval()}'><b>{trait_name}</b></font>", self.styles['TraitTitle']),
                '',
                Paragraph(f"<b>{interpretation}</b>", self.styles['ScoreValue'])
            ]]
            header_table = Table(header_data, colWidths=[3*inch, 1*inch, 2*inch])
            header_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BACKGROUND', (0, 0), (-1, -1), self.colors['light']),
                ('LEFTPADDING', (0, 0), (0, 0), 10),
                ('RIGHTPADDING', (2, 0), (2, 0), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(header_table)
            
            # Score details
            score_data = [[
                f"Percentile: {percentile:.0f}%",
                f"T-Score: {t_score:.0f}",
                f"Raw Score: {raw_score}/50"
            ]]
            score_table = Table(score_data, colWidths=[2*inch, 2*inch, 2*inch])
            score_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('TEXTCOLOR', (0, 0), (-1, -1), self.colors['muted']),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(score_table)
            
            # Progress bar visualization
            bar_drawing = Drawing(480, 20)
            # Background
            bar_drawing.add(Rect(10, 5, 460, 10, fillColor=self.colors['border'], strokeWidth=0))
            # Filled portion
            fill_width = max(5, (percentile / 100) * 460)
            bar_drawing.add(Rect(10, 5, fill_width, 10, fillColor=color, strokeWidth=0))
            elements.append(bar_drawing)
            
            # Description
            desc_info = trait_descriptions.get(trait_key, {})
            elements.append(Paragraph(desc_info.get('desc', ''), self.styles['Description']))
            
            # Interpretation based on score
            if percentile >= 60:
                interp_text = desc_info.get('high', '')
            elif percentile >= 40:
                interp_text = desc_info.get('average', '')
            else:
                interp_text = desc_info.get('low', '')
            
            elements.append(Paragraph(f"<b>Your Score Indicates:</b> {interp_text}", self.styles['ReportBodyText']))
        
        return elements

    def _create_predictions_section(self, predictions: Dict[str, Any]) -> List:
        """Create outcome predictions section."""
        elements = []
        
        elements.append(Paragraph("Predicted Outcomes", self.styles['SectionTitle']))
        
        elements.append(Paragraph(
            "Based on meta-analytic research correlating personality traits with life outcomes, "
            "the following predictions represent statistically-derived estimates. These should be "
            "interpreted as general tendencies, not certainties.",
            self.styles['ReportBodyText']
        ))
        
        elements.append(Spacer(1, 15))
        
        # Map prediction keys to display names
        prediction_map = {
            'jobPerformanceScore': ('Job Performance', 'Predicts effectiveness in professional roles based on trait patterns.'),
            'job_performance': ('Job Performance', 'Predicts effectiveness in professional roles based on trait patterns.'),
            'academicPerformanceScore': ('Academic Performance', 'Predicts success in educational and learning environments.'),
            'academic_performance': ('Academic Performance', 'Predicts success in educational and learning environments.'),
            'leadershipScore': ('Leadership Effectiveness', 'Predicts ability to lead, inspire, and manage others effectively.'),
            'leadership_effectiveness': ('Leadership Effectiveness', 'Predicts ability to lead, inspire, and manage others effectively.')
        }
        
        pred_data = []
        for key, value in predictions.items():
            if key not in prediction_map:
                continue
            
            name, desc = prediction_map[key]
            
            if isinstance(value, dict):
                score = value.get('score', 0)
            else:
                score = value
            
            # Determine interpretation
            if score >= 80:
                interp = "Very High"
                color = self.colors['success']
            elif score >= 60:
                interp = "High"
                color = self.colors['secondary']
            elif score >= 40:
                interp = "Average"
                color = self.colors['text']
            else:
                interp = "Below Average"
                color = self.colors['warning']
            
            pred_data.append((name, score, interp, color, desc))
        
        for name, score, interp, color, desc in pred_data:
            # Prediction card
            card_data = [[
                Paragraph(f"<b>{name}</b>", self.styles['TraitTitle']),
                Paragraph(f"<font color='{color.hexval()}'><b>{score:.0f}/100</b></font>", self.styles['ScoreValue']),
                Paragraph(f"<b>{interp}</b>", self.styles['ReportBodyText'])
            ]]
            card_table = Table(card_data, colWidths=[2.5*inch, 1.5*inch, 2*inch])
            card_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), self.colors['light']),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            elements.append(card_table)
            elements.append(Paragraph(desc, self.styles['Description']))
            elements.append(Spacer(1, 8))
        
        return elements

    def _parse_guidance_content(self, content: str) -> List:
        """Parse and format guidance content for PDF."""
        elements = []
        
        if not content:
            return elements
        
        elements.append(PageBreak())
        elements.append(Paragraph("Personalized Guidance & Recommendations", self.styles['SectionTitle']))
        
        elements.append(Paragraph(
            "The following personalized analysis was generated based on your unique personality profile, "
            "goals, and current situation. These insights are tailored specifically for you.",
            self.styles['ReportBodyText']
        ))
        
        elements.append(Spacer(1, 15))
        
        # Parse markdown-style content
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Handle headers (### or ##)
            if line.startswith('###'):
                header_text = line.replace('###', '').strip()
                # Clean emoji - keep alphanumeric, spaces, hyphens, ampersands
                header_text = re.sub(r'[^\w\s\-&\'\"]', '', header_text).strip()
                if header_text:
                    elements.append(Paragraph(header_text, self.styles['GuidanceHeader']))
            elif line.startswith('##'):
                header_text = line.replace('##', '').strip()
                header_text = re.sub(r'[^\w\s\-&\'\"]', '', header_text).strip()
                if header_text:
                    elements.append(Paragraph(header_text, self.styles['GuidanceHeader']))
            
            # Handle bullet points
            elif line.startswith(('•', '-', '*')) and len(line) > 1:
                bullet_text = line.lstrip('•-* ').strip()
                # Bold text within **
                bullet_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', bullet_text)
                elements.append(Paragraph(f"  •  {bullet_text}", self.styles['BulletText']))
            
            # Handle numbered items
            elif len(line) > 2 and line[0].isdigit() and '.' in line[:4]:
                num_text = line.strip()
                # Bold text within **
                num_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', num_text)
                elements.append(Paragraph(num_text, self.styles['BulletText']))
            
            # Regular paragraph
            else:
                # Bold text within **
                para_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
                elements.append(Paragraph(para_text, self.styles['GuidanceText']))
        
        return elements

    def _create_footer_section(self) -> List:
        """Create professional footer section."""
        elements = []
        
        elements.append(Spacer(1, 40))
        elements.append(HRFlowable(width="100%", thickness=1, color=self.colors['border']))
        elements.append(Spacer(1, 15))
        
        # Disclaimer
        disclaimer = (
            "<b>Disclaimer:</b> This assessment is based on the IPIP-50 inventory, a scientifically validated "
            "measure of the Big Five personality traits. Results should be interpreted as general tendencies "
            "and used for self-awareness and development purposes. This report does not constitute "
            "psychological diagnosis or professional mental health advice."
        )
        elements.append(Paragraph(disclaimer, self.styles['Footer']))
        
        elements.append(Spacer(1, 10))
        
        # Footer info
        elements.append(Paragraph(
            f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
            self.styles['Footer']
        ))
        elements.append(Paragraph(
            "Big Five Personality Assessment System | Confidential Document",
            self.styles['Footer']
        ))
        
        return elements

    def generate_pdf(
        self, 
        assessment_data: Dict[str, Any],
        include_recommendations: bool = True
    ) -> bytes:
        """
        Generate a professional PDF report from assessment data.
        
        Args:
            assessment_data: Complete assessment data including user, scores, predictions, guidance
            include_recommendations: Whether to include the guidance section
            
        Returns:
            PDF file as bytes
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=0.6*inch,
            leftMargin=0.6*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        elements = []
        
        # Extract data from assessment
        user_data = assessment_data.get('user', assessment_data.get('userData', {}))
        session_data = assessment_data.get('session', {})
        raw_scores = assessment_data.get('scores', assessment_data.get('traits', {}))
        predictions = assessment_data.get('predictions', {})
        guidance = assessment_data.get('guidance', {})
        guidance_content = guidance.get('content', '') if isinstance(guidance, dict) else ''
        
        # Calculate full trait scores from raw scores
        traits = self._calculate_scores(raw_scores)
        
        # Build document sections
        elements.extend(self._create_cover_page(user_data, session_data))
        # elements.extend(self._create_overview_section(traits))
        elements.append(PageBreak())
        elements.extend(self._create_detailed_traits_section(traits))
        
        if predictions:
            elements.append(PageBreak())
            elements.extend(self._create_predictions_section(predictions))
        
        if include_recommendations and guidance_content:
            elements.extend(self._parse_guidance_content(guidance_content))
        
        elements.extend(self._create_footer_section())
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()


# Global service instance
pdf_service = PDFService()
