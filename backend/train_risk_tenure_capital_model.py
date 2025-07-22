import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from sklearn.metrics import f1_score, hamming_loss, classification_report, roc_auc_score
from sklearn.multiclass import OneVsRestClassifier
from sklearn.model_selection import RandomizedSearchCV
from imblearn.over_sampling import RandomOverSampler
import numpy as np
import joblib

# Load datasets
with open('training_data.json', 'r') as f:
    train_data = json.load(f)
with open('validation_data.json', 'r') as f:
    val_data = json.load(f)
with open('testing_data.json', 'r') as f:
    test_data = json.load(f)

def bin_capital(capital):
    if capital < 20000:
        return 'low'
    elif capital < 60000:
        return 'medium'
    else:
        return 'high'

def preprocess(data):
    rows = []
    for row in data:
        if row['recommendations']:
            rows.append({
                'risk_level': row['risk_level'].strip().capitalize(),
                'tenure': row['tenure'],
                'capital': row['capital'],
                'capital_bin': bin_capital(row['capital']),
                'recommendations': row['recommendations']
            })
    return pd.DataFrame(rows)

df_train = preprocess(train_data)
df_val = preprocess(val_data)
df_test = preprocess(test_data)

# Encode categorical features
encoders = {}
le_risk = LabelEncoder()
df_train['risk_level'] = le_risk.fit_transform(df_train['risk_level'])
df_val['risk_level'] = le_risk.transform(df_val['risk_level'])
df_test['risk_level'] = le_risk.transform(df_test['risk_level'])
encoders['risk_level'] = le_risk

le_capbin = LabelEncoder()
df_train['capital_bin'] = le_capbin.fit_transform(df_train['capital_bin'])
df_val['capital_bin'] = le_capbin.transform(df_val['capital_bin'])
df_test['capital_bin'] = le_capbin.transform(df_test['capital_bin'])
encoders['capital_bin'] = le_capbin

# Multi-label binarizer for recommendations
mlb = MultiLabelBinarizer()
y_train = mlb.fit_transform(df_train['recommendations'])
y_val = mlb.transform(df_val['recommendations'])
y_test = mlb.transform(df_test['recommendations'])
encoders['recommendations'] = mlb

feature_cols = ['risk_level', 'tenure', 'capital', 'capital_bin']
X_train = df_train[feature_cols]
X_val = df_val[feature_cols]
X_test = df_test[feature_cols]

# Oversample rare labels
# ros = RandomOverSampler(random_state=42)
# X_train_os, y_train_os = ros.fit_resample(X_train, y_train)
X_train_os, y_train_os = X_train, y_train

# Hyperparameter tuning for RandomForest
param_dist = {
    'estimator__n_estimators': [100, 200, 300],
    'estimator__max_depth': [None, 10, 20, 30],
    'estimator__min_samples_split': [2, 5, 10],
    'estimator__min_samples_leaf': [1, 2, 4],
    'estimator__max_features': ['auto', 'sqrt', 'log2']
}
base_rf = RandomForestClassifier(random_state=42, class_weight='balanced')
ovr = OneVsRestClassifier(base_rf)
search = RandomizedSearchCV(ovr, param_distributions=param_dist, n_iter=10, scoring='f1_micro', cv=3, verbose=1, n_jobs=-1, random_state=42)
search.fit(X_train_os, y_train_os)
clf = search.best_estimator_

# Validate
val_probs = clf.predict_proba(X_val)
# Threshold tuning
best_thresholds = []
val_preds_opt = np.zeros_like(y_val)
for i in range(y_val.shape[1]):
    best_f1 = 0
    best_t = 0.5
    for t in np.arange(0.2, 0.81, 0.05):
        preds = (val_probs[i][:,1] if isinstance(val_probs, list) else val_probs[:,i]) >= t
        f1 = f1_score(y_val[:,i], preds)
        if f1 > best_f1:
            best_f1 = f1
            best_t = t
    best_thresholds.append(best_t)
    val_preds_opt[:,i] = (val_probs[i][:,1] if isinstance(val_probs, list) else val_probs[:,i]) >= best_t

print('Validation Hamming Loss:', hamming_loss(y_val, val_preds_opt))
print('Validation F1 Score (micro):', f1_score(y_val, val_preds_opt, average='micro'))
print('Validation Classification Report:\n', classification_report(y_val, val_preds_opt, target_names=mlb.classes_))

# Test with optimized thresholds
if isinstance(val_probs, list):
    test_probs = np.column_stack([clf.estimators_[i].predict_proba(X_test)[:,1] for i in range(y_test.shape[1])])
else:
    test_probs = clf.predict_proba(X_test)
test_preds_opt = np.zeros_like(y_test)
for i, t in enumerate(best_thresholds):
    test_preds_opt[:,i] = (test_probs[:,i] >= t)

print('Test Hamming Loss:', hamming_loss(y_test, test_preds_opt))
print('Test F1 Score (micro):', f1_score(y_test, test_preds_opt, average='micro'))
print('Test Classification Report:\n', classification_report(y_test, test_preds_opt, target_names=mlb.classes_))

# Save model, encoders, and thresholds
joblib.dump(clf, 'risk_tenure_capital_model.pkl')
joblib.dump(encoders, 'risk_tenure_capital_encoders.pkl')
joblib.dump(best_thresholds, 'risk_tenure_capital_thresholds.pkl')

print('Model, encoders, and thresholds saved as risk_tenure_capital_model.pkl, risk_tenure_capital_encoders.pkl, and risk_tenure_capital_thresholds.pkl')