"""
ThreatLens ML Preprocessing
Handles data loading, cleaning, and feature engineering for NSL-KDD dataset.
"""
import os
import sys
import urllib.request
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

from config import (
    COLUMN_NAMES, FEATURE_NAMES, CATEGORICAL_FEATURES, NUMERIC_FEATURES,
    ATTACK_CATEGORY_MAP, DATA_DIR, TRAIN_FILE, TEST_FILE, NSL_KDD_URLS
)


def download_dataset():
    """Download NSL-KDD dataset if not present."""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    files = {
        "KDDTrain+.txt": NSL_KDD_URLS["train"],
        "KDDTest+.txt": NSL_KDD_URLS["test"],
    }
    
    for filename, url in files.items():
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            print(f"Downloading {filename}...")
            try:
                urllib.request.urlretrieve(url, filepath)
                print(f"  [OK] Saved to {filepath}")
            except Exception as e:
                print(f"  [FAIL] Failed to download {filename}: {e}")
                print(f"  Please manually download NSL-KDD and place files in: {DATA_DIR}")
                print(f"  Expected files: KDDTrain+.txt, KDDTest+.txt")
                return False
    return True


def load_data(filepath):
    """Load NSL-KDD data file with correct column names."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Dataset file not found: {filepath}\n"
            f"Please place NSL-KDD files in: {DATA_DIR}\n"
            f"Expected: KDDTrain+.txt, KDDTest+.txt"
        )
    
    df = pd.read_csv(filepath, header=None, names=COLUMN_NAMES)
    print(f"Loaded {len(df)} records from {os.path.basename(filepath)}")
    return df


def clean_data(df):
    """Clean dataset — handle duplicates and basic sanitization."""
    initial_count = len(df)
    
    # Drop the difficulty_level column (not a feature)
    if "difficulty_level" in df.columns:
        df = df.drop(columns=["difficulty_level"])
    
    # Drop exact duplicates
    df = df.drop_duplicates()
    removed = initial_count - len(df)
    if removed > 0:
        print(f"  Removed {removed} duplicate rows")
    
    # Check for missing values
    missing = df.isnull().sum().sum()
    if missing > 0:
        print(f"  Warning: {missing} missing values found — dropping rows with NaN")
        df = df.dropna()
    
    return df


def map_labels_binary(df):
    """Map labels to binary: normal=0, attack=1."""
    df = df.copy()
    df["binary_label"] = df["label"].apply(
        lambda x: 0 if x.strip().lower() == "normal" else 1
    )
    return df


def map_attack_category(label):
    """Map specific attack name to attack category."""
    label_lower = label.strip().lower()
    return ATTACK_CATEGORY_MAP.get(label_lower, "Unknown")


def map_labels_multiclass(df):
    """Map labels to attack categories for future multi-class support."""
    df = df.copy()
    df["attack_category"] = df["label"].apply(map_attack_category)
    return df


def get_feature_label_split(df, label_col="binary_label"):
    """Separate features and labels."""
    X = df[FEATURE_NAMES].copy()
    y = df[label_col].copy()
    return X, y


def build_preprocessor():
    """
    Build a ColumnTransformer that:
    - One-hot encodes categorical features
    - Scales numeric features
    
    This preprocessor is fit ONLY on training data to prevent data leakage.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ],
        remainder="drop"
    )
    return preprocessor


def prepare_training_data():
    """
    Full data preparation pipeline.
    Returns X_train, X_test, y_train, y_test, preprocessor, and metadata.
    
    Uses NSL-KDD's own train/test split to avoid data leakage.
    """
    # Ensure dataset is available
    if not os.path.exists(TRAIN_FILE) or not os.path.exists(TEST_FILE):
        print("Dataset not found. Attempting download...")
        if not download_dataset():
            sys.exit(1)
    
    # Load data
    print("\n--- Loading Data ---")
    train_df = load_data(TRAIN_FILE)
    test_df = load_data(TEST_FILE)
    
    # Clean
    print("\n--- Cleaning Data ---")
    print("Training set:")
    train_df = clean_data(train_df)
    print("Test set:")
    test_df = clean_data(test_df)
    
    # Map labels
    print("\n--- Mapping Labels ---")
    train_df = map_labels_binary(train_df)
    test_df = map_labels_binary(test_df)
    train_df = map_labels_multiclass(train_df)
    test_df = map_labels_multiclass(test_df)
    
    # Print class distribution
    print("\nTraining set class distribution:")
    print(train_df["binary_label"].value_counts().to_string())
    print(f"\nTraining set attack categories:")
    print(train_df["attack_category"].value_counts().to_string())
    
    print("\nTest set class distribution:")
    print(test_df["binary_label"].value_counts().to_string())
    
    # Split features and labels
    X_train, y_train = get_feature_label_split(train_df)
    X_test, y_test = get_feature_label_split(test_df)
    
    print(f"\nFeature shape — Train: {X_train.shape}, Test: {X_test.shape}")
    
    # Metadata for storage
    metadata = {
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "n_features": len(FEATURE_NAMES),
        "train_class_distribution": train_df["binary_label"].value_counts().to_dict(),
        "test_class_distribution": test_df["binary_label"].value_counts().to_dict(),
        "train_attack_categories": train_df["attack_category"].value_counts().to_dict(),
        "test_attack_categories": test_df["attack_category"].value_counts().to_dict(),
    }
    
    # Store original labels for multi-class future use
    metadata["train_original_labels"] = train_df["label"].value_counts().to_dict()
    metadata["test_original_labels"] = test_df["label"].value_counts().to_dict()
    
    return X_train, X_test, y_train, y_test, metadata


if __name__ == "__main__":
    X_train, X_test, y_train, y_test, meta = prepare_training_data()
    print("\n--- Preprocessing Complete ---")
    print(f"Train: {X_train.shape}, Test: {X_test.shape}")
    print(f"Metadata: {meta}")
