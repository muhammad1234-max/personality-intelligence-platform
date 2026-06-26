# app/services/pdf_service_v2.py
"""
Streamlined PDF generation service for Big Five Personality Assessment reports.
Produces clean, professional, and concise reports with actual evaluated results.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, HRFlowable
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from io import BytesIO
from typing import Dict, Any, List
from datetime import datetime
from scipy import stats


class PDFServiceV2:
    """Streamlined PDF report generator focused on essential, personalized content."""
    
    # Dataset-derived population norms (calculated from 1M+ IPIP-50 respondents)
    # Values updated via compute_norms.py from data.csv
    NORMS = {
        'extraversion': {'mean': 29.6, 'std': 9.1},
        'agreeableness': {'mean': 36.0, 'std': 5.9},
        'conscientiousness': {'mean': 32.3, 'std': 6.6},
        'neuroticism': {'mean': 30.6, 'std': 8.6},
        'openness': {'mean': 38.7, 'std': 6.4}
    }
    
    TRAIT_CONFIG = {
        'extraversion': {'name': 'Extraversion', 'color': '#dc2626', 'short': 'E'},
        'agreeableness': {'name': 'Agreeableness', 'color': '#16a34a', 'short': 'A'},
        'conscientiousness': {'name': 'Conscientiousness', 'color': '#2563eb', 'short': 'C'},
        'neuroticism': {'name': 'Neuroticism', 'color': '#d97706', 'short': 'N'},
        'openness': {'name': 'Openness', 'color': '#7c3aed', 'short': 'O'}
    }
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_styles()
    
    def _setup_styles(self):
        """Setup minimal professional styles."""
        self.styles.add(ParagraphStyle(
            name='ReportTitle', fontSize=24, spaceAfter=8,
            textColor=colors.HexColor('#0f172a'), fontName='Helvetica-Bold',
            alignment=TA_CENTER
        ))
        self.styles.add(ParagraphStyle(
            name='Subtitle', fontSize=11, spaceAfter=20,
            textColor=colors.HexColor('#64748b'), alignment=TA_CENTER
        ))
        self.styles.add(ParagraphStyle(
            name='SectionTitle', fontSize=14, spaceBefore=20, spaceAfter=10,
            textColor=colors.HexColor('#1e40af'), fontName='Helvetica-Bold'
        ))
        self.styles.add(ParagraphStyle(
            name='ReportBody', fontSize=10, leading=14, alignment=TA_JUSTIFY,
            textColor=colors.HexColor('#334155'), spaceAfter=6
        ))
        self.styles.add(ParagraphStyle(
            name='SmallText', fontSize=9, leading=12,
            textColor=colors.HexColor('#64748b'), spaceAfter=4
        ))
        self.styles.add(ParagraphStyle(
            name='Footer', fontSize=8, textColor=colors.HexColor('#94a3b8'),
            alignment=TA_CENTER
        ))
    
    def _calculate_trait_data(self, raw_scores: Dict) -> Dict[str, Dict]:
        """Calculate percentiles and interpretations from raw scores using dataset norms."""
        traits = {}
        
        for trait_key, config in self.TRAIT_CONFIG.items():
            score_data = raw_scores.get(trait_key, {})
            raw_score = score_data.get('rawScore', 30) if isinstance(score_data, dict) else score_data
            
            norm = self.NORMS.get(trait_key)
            z_score = (raw_score - norm['mean']) / norm['std']
            percentile = round(stats.norm.cdf(z_score) * 100, 1)
            t_score = round(50 + (10 * z_score), 1)
            
            # Determine interpretation
            if percentile >= 80: interpretation = "Very High"
            elif percentile >= 60: interpretation = "High"
            elif percentile >= 40: interpretation = "Average"
            elif percentile >= 20: interpretation = "Low"
            else: interpretation = "Very Low"
            
            traits[trait_key] = {
                'name': config['name'],
                'color': config['color'],
                'short': config['short'],
                'rawScore': raw_score,
                'maxScore': 50,
                'percentile': percentile,
                'tScore': t_score,
                'interpretation': interpretation,
                'description': self._get_trait_description(trait_key, percentile)
            }
        
        return traits
    
    def _get_trait_description(self, trait: str, percentile: float) -> str:
        """Generate personalized interpretation based on actual score."""
        descriptions = {
            'extraversion': {
                'high': "You thrive in social situations and enjoy being around others. Your energy and enthusiasm make you naturally engaging.",
                'avg': "You're comfortable in both social and solitary settings, adapting well to different environments.",
                'low': "You prefer meaningful one-on-one interactions over large gatherings. You value depth over breadth in relationships."
            },
            'agreeableness': {
                'high': "You prioritize harmony and cooperation. Others see you as warm, trusting, and helpful.",
                'avg': "You balance cooperation with healthy self-interest, knowing when to compromise and when to stand firm.",
                'low': "You're direct and task-focused. You value efficiency and aren't afraid to challenge ideas constructively."
            },
            'conscientiousness': {
                'high': "You're highly organized, disciplined, and reliable. You set clear goals and follow through systematically.",
                'avg': "You maintain reasonable structure while staying flexible. You can focus when needed but adapt to change.",
                'low': "You prefer spontaneity and flexibility. You think creatively and adapt quickly to changing situations."
            },
            'neuroticism': {
                'high': "You experience emotions deeply. This sensitivity can fuel creativity and empathy when channeled well.",
                'avg': "You handle stress reasonably well, experiencing normal emotional fluctuations without being overwhelmed.",
                'low': "You remain calm under pressure. Your emotional stability helps you navigate challenges effectively."
            },
            'openness': {
                'high': "You're intellectually curious and creative. You enjoy exploring new ideas and unconventional perspectives.",
                'avg': "You appreciate both innovation and proven methods, balancing creativity with practicality.",
                'low': "You prefer concrete, practical approaches. You value reliability and focus on what's proven to work."
            }
        }
        
        level = 'high' if percentile >= 60 else ('low' if percentile < 40 else 'avg')
        return descriptions.get(trait, {}).get(level, "")
    
    def _create_header(self, user_data: Dict, session_data: Dict) -> List:
        """Create concise header section."""
        elements = []
        
        name = user_data.get('name', 'Anonymous')
        age = user_data.get('age', '')
        country = user_data.get('country', '')
        
        # Get completion date
        completed_at = session_data.get('completedAt', datetime.now().isoformat())
        try:
            date_obj = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
            date_str = date_obj.strftime("%B %d, %Y")
        except:
            date_str = datetime.now().strftime("%B %d, %Y")
        
        # Duration
        duration_sec = session_data.get('totalDurationSec', 0)
        duration_min = round(duration_sec / 60, 1) if duration_sec else 0
        
        elements.append(Spacer(1, 30))
        elements.append(Paragraph("PERSONALITY PROFILE", self.styles['ReportTitle']))
        
        # Decorative line
        drawing = Drawing(400, 4)
        drawing.add(Line(100, 2, 300, 2, strokeColor=colors.HexColor('#1e40af'), strokeWidth=2))
        elements.append(drawing)
        
        elements.append(Paragraph("Big Five Assessment (IPIP-50)", self.styles['Subtitle']))
        elements.append(Spacer(1, 20))
        
        # Participant info - clean single table
        info_data = [
            ['Name', name, 'Date', date_str],
            ['Age', str(age), 'Duration', f'{duration_min} min' if duration_min else 'N/A'],
            ['Country', country, '', '']
        ]
        
        info_table = Table(info_data, colWidths=[1.2*inch, 2*inch, 1.2*inch, 2*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#64748b')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#0f172a')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 25))
        
        return elements
    
    def _create_visual_summary(self, traits: Dict) -> List:
        """Create consolidated visual trait overview."""
        elements = []
        
        elements.append(Paragraph("Trait Overview", self.styles['SectionTitle']))
        
        # Create horizontal bar chart
        drawing = Drawing(500, 180)
        chart = VerticalBarChart()
        chart.x = 50
        chart.y = 30
        chart.width = 400
        chart.height = 130
        
        trait_order = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness']
        percentiles = [traits[t]['percentile'] for t in trait_order]
        
        chart.data = [percentiles]
        chart.categoryAxis.categoryNames = [traits[t]['short'] for t in trait_order]
        chart.categoryAxis.labels.fontName = 'Helvetica-Bold'
        chart.categoryAxis.labels.fontSize = 11
        
        chart.valueAxis.valueMin = 0
        chart.valueAxis.valueMax = 100
        chart.valueAxis.valueStep = 25
        chart.valueAxis.labels.fontSize = 9
        
        # Set colors for each bar
        for i, trait_key in enumerate(trait_order):
            chart.bars[0].fillColor = colors.HexColor(traits[trait_key]['color'])
        
        chart.bars.strokeWidth = 0
        chart.barWidth = 50
        
        # Reference line at 50%
        drawing.add(Line(50, 95, 450, 95, strokeColor=colors.HexColor('#e2e8f0'), strokeWidth=0.5, strokeDashArray=[3,3]))
        drawing.add(String(455, 92, "50%", fontSize=8, fillColor=colors.HexColor('#94a3b8')))
        
        drawing.add(chart)
        elements.append(drawing)
        
        # Legend
        legend_text = "E=Extraversion  A=Agreeableness  C=Conscientiousness  N=Neuroticism  O=Openness"
        elements.append(Paragraph(f"<i>{legend_text}</i>", self.styles['SmallText']))
        elements.append(Spacer(1, 15))
        
        # Score summary table
        summary_data = [['Trait', 'Percentile', 'T-Score', 'Level']]
        for trait_key in trait_order:
            t = traits[trait_key]
            summary_data.append([t['name'], f"{t['percentile']:.0f}%", f"{t['tScore']:.0f}", t['interpretation']])
        
        summary_table = Table(summary_data, colWidths=[2*inch, 1.2*inch, 1*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ]))
        
        elements.append(summary_table)
        
        return elements
    
    def _create_trait_details(self, traits: Dict) -> List:
        """Create personalized trait interpretations."""
        elements = []
        
        elements.append(PageBreak())
        elements.append(Paragraph("Detailed Analysis", self.styles['SectionTitle']))
        
        for trait_key in ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness']:
            t = traits[trait_key]
            color = colors.HexColor(t['color'])
            
            # Trait header with score
            header_text = f"<font color='{t['color']}'><b>{t['name']}</b></font> — {t['interpretation']} ({t['percentile']:.0f}%)"
            elements.append(Paragraph(header_text, self.styles['ReportBody']))
            
            # Progress bar
            bar_drawing = Drawing(480, 12)
            bar_drawing.add(Rect(0, 2, 460, 8, fillColor=colors.HexColor('#e5e7eb'), strokeWidth=0))
            fill_width = max(5, (t['percentile'] / 100) * 460)
            bar_drawing.add(Rect(0, 2, fill_width, 8, fillColor=color, strokeWidth=0))
            elements.append(bar_drawing)
            
            # Personal interpretation
            elements.append(Paragraph(t['description'], self.styles['SmallText']))
            elements.append(Spacer(1, 12))
        
        return elements
    
    def _create_footer(self) -> List:
        """Create minimal professional footer."""
        elements = []
        
        elements.append(Spacer(1, 30))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0')))
        elements.append(Spacer(1, 10))
        
        elements.append(Paragraph(
            f"Generated: {datetime.now().strftime('%B %d, %Y')} | Big Five Personality Assessment",
            self.styles['Footer']
        ))
        elements.append(Paragraph(
            "Based on IPIP-50 inventory. For personal development purposes only.",
            self.styles['Footer']
        ))
        
        return elements
    
    def generate_pdf(self, assessment_data: Dict[str, Any]) -> bytes:
        """
        Generate a clean, professional PDF report.
        
        Args:
            assessment_data: Assessment data including user, scores, session info
            
        Returns:
            PDF bytes
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=0.6*inch, leftMargin=0.6*inch,
            topMargin=0.5*inch, bottomMargin=0.5*inch
        )
        
        # Extract data
        user_data = assessment_data.get('user', assessment_data.get('userData', {}))
        session_data = assessment_data.get('session', {})
        raw_scores = assessment_data.get('scores', assessment_data.get('traits', {}))
        
        # Calculate trait data with personalized interpretations
        traits = self._calculate_trait_data(raw_scores)
        
        # Build document
        elements = []
        elements.extend(self._create_header(user_data, session_data))
        elements.extend(self._create_visual_summary(traits))
        elements.extend(self._create_trait_details(traits))
        elements.extend(self._create_footer())
        
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()


# Singleton instance
pdf_service_v2 = PDFServiceV2()


def generate_pdf(assessment_data: Dict[str, Any]) -> bytes:
    """Convenience function for PDF generation."""
    return pdf_service_v2.generate_pdf(assessment_data)
