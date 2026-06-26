#!/usr/bin/env python3
"""
Dataset-Driven Scoring Engine (T5)

This script computes trait norms (mean and std) from the IPIP-50 dataset
and updates the OWL ontology with actual dataset-derived values.

The data.csv contains:
- E1-E10, A1-A10, C1-C10, N1-N10, O1-O10: Response scores (1-5 scale)
- EXT1_E-EXT10_E, etc.: Response times in ms

Reverse-scored items (per IPIP):
- E: 2, 4, 6, 8, 10
- A: 1, 3, 5, 7, 9 
- C: 2, 4, 6, 8, 10
- N: 2, 4
- O: 2, 4, 6
"""

import pandas as pd
import numpy as np
import re
from pathlib import Path


# Question mapping based on IPIP-50 scoring key
# Map question columns to traits with reverse scoring
TRAIT_QUESTIONS = {
    'extraversion': {
        'positive': ['EXT1', 'EXT3', 'EXT5', 'EXT7', 'EXT9'],
        'negative': ['EXT2', 'EXT4', 'EXT6', 'EXT8', 'EXT10']
    },
    'agreeableness': {
        'positive': ['AGR2', 'AGR4', 'AGR6', 'AGR8', 'AGR10'],
        'negative': ['AGR1', 'AGR3', 'AGR5', 'AGR7', 'AGR9']
    },
    'conscientiousness': {
        'positive': ['CSN1', 'CSN3', 'CSN5', 'CSN7', 'CSN9'],
        'negative': ['CSN2', 'CSN4', 'CSN6', 'CSN8', 'CSN10']
    },
    'neuroticism': {
        'positive': ['EST1', 'EST3', 'EST5', 'EST6', 'EST7', 'EST8', 'EST9', 'EST10'],
        'negative': ['EST2', 'EST4']
    },
    'openness': {
        'positive': ['OPN1', 'OPN3', 'OPN5', 'OPN7', 'OPN8', 'OPN9', 'OPN10'],
        'negative': ['OPN2', 'OPN4', 'OPN6']
    }
}


def load_dataset(file_path: str) -> pd.DataFrame:
    """Load the IPIP dataset."""
    print(f"Loading dataset from {file_path}...")
    df = pd.read_csv(file_path, sep='\t')
    print(f"Loaded {len(df)} records with {len(df.columns)} columns")
    return df


def compute_trait_score(row: pd.Series, trait: str) -> float:
    """
    Compute trait score for a single respondent.
    
    - Positive items: score as-is (1-5)
    - Negative items: reverse score (6 - score)
    """
    config = TRAIT_QUESTIONS[trait]
    total = 0
    
    for col in config['positive']:
        val = row.get(col, np.nan)
        if pd.notna(val) and 1 <= val <= 5:
            total += val
    
    for col in config['negative']:
        val = row.get(col, np.nan)
        if pd.notna(val) and 1 <= val <= 5:
            total += (6 - val)  # Reverse score
    
    return total


def compute_norms(df: pd.DataFrame) -> dict:
    """
    Compute population norms for each trait.
    
    Returns dict with mean and std for each trait.
    """
    norms = {}
    
    print("\n" + "=" * 50)
    print("COMPUTING DATASET-DERIVED NORMS")
    print("=" * 50)
    
    for trait in TRAIT_QUESTIONS.keys():
        scores = df.apply(lambda row: compute_trait_score(row, trait), axis=1)
        
        # Remove outliers (scores outside valid range 10-50)
        valid_scores = scores[(scores >= 10) & (scores <= 50)]
        
        mean = round(valid_scores.mean(), 1)
        std = round(valid_scores.std(), 1)
        
        norms[trait] = {'mean': mean, 'std': std}
        
        print(f"\n{trait.upper()}:")
        print(f"  Valid samples: {len(valid_scores)}")
        print(f"  Mean: {mean}")
        print(f"  Std:  {std}")
        print(f"  Min:  {valid_scores.min()}")
        print(f"  Max:  {valid_scores.max()}")
    
    return norms


def update_ontology_norms(ontology_path: str, norms: dict):
    """
    Update the OWL ontology file with computed norms.
    """
    print(f"\nUpdating ontology at {ontology_path}...")
    
    with open(ontology_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Map trait names to ontology norm class names
    trait_to_norm = {
        'extraversion': 'ExtraversionNorm',
        'agreeableness': 'AgreeablenessNorm', 
        'conscientiousness': 'ConscientiousnessNorm',
        'neuroticism': 'NeuroticismNorm',
        'openness': 'OpennessNorm'
    }
    
    for trait, norm_data in norms.items():
        norm_name = trait_to_norm[trait]
        
        # Pattern to match the norm instance and its properties
        # This handles the XML format in the OWL file
        pattern = rf'(:{norm_name}\s+[^;]*;[^;]*\n\s*:populationMean\s+)\d+\.?\d*'
        replacement = rf'\g<1>{norm_data["mean"]}'
        content = re.sub(pattern, replacement, content)
        
        pattern = rf'(:{norm_name}\s+[^;]*populationMean[^;]*;\s*\n\s*:populationStd\s+)\d+\.?\d*'
        replacement = rf'\g<1>{norm_data["std"]}'
        content = re.sub(pattern, replacement, content)
        
        print(f"  Updated {norm_name}: mean={norm_data['mean']}, std={norm_data['std']}")
    
    with open(ontology_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\nOntology updated successfully!")


def generate_norms_json(norms: dict, output_path: str):
    """Generate a JSON file with computed norms for reference."""
    import json
    
    with open(output_path, 'w') as f:
        json.dump(norms, f, indent=2)
    
    print(f"\nNorms saved to {output_path}")


def main():
    base_path = Path(__file__).parent
    
    # Load dataset
    dataset_path = base_path / 'data.csv'
    if not dataset_path.exists():
        print(f"ERROR: Dataset not found at {dataset_path}")
        return
    
    df = load_dataset(str(dataset_path))
    
    # Compute norms
    norms = compute_norms(df)
    
    # Update ontology
    ontology_path = base_path / 'app' / 'ontology.owl'
    if ontology_path.exists():
        update_ontology_norms(str(ontology_path), norms)
    else:
        print(f"WARNING: Ontology not found at {ontology_path}")
    
    # Save norms JSON for reference
    norms_path = base_path / 'computed_norms.json'
    generate_norms_json(norms, str(norms_path))
    
    # Print summary
    print("\n" + "=" * 50)
    print("SUMMARY: Dataset-Derived Norms")
    print("=" * 50)
    print("\nCopy these values to pdf_service_v2.py NORMS dict:\n")
    print("NORMS = {")
    for trait, data in norms.items():
        print(f"    '{trait}': ({data['mean']}, {data['std']}),")
    print("}")


if __name__ == '__main__':
    main()
