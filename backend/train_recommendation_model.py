import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from sklearn.metrics import accuracy_score, classification_report, f1_score, hamming_loss
from sklearn.multiclass import OneVsRestClassifier
import joblib

# Load datasets
with open('training_dataset.json', 'r') as f:
    train_data = json.load(f)
with open('validation_dataset.json', 'r') as f:
    val_data = json.load(f)
with open('test_dataset.json', 'r') as f:
    test_data = json.load(f)

def preprocess(data):
    rows = []
    for row in data:
        if row['recommendations']:
            rows.append({
                'risk_profile': row['risk_profile'],
                'behavior': row['behavior'],
                'goal': row['goal'],
                'recommendations': row['recommendations']
            })
    return pd.DataFrame(rows)

df_train = preprocess(train_data)
df_val = preprocess(val_data)
df_test = preprocess(test_data)

# Encode categorical features
feature_cols = ['risk_profile', 'behavior', 'goal']
encoders = {}
for col in feature_cols:
    le = LabelEncoder()
    df_train[col] = le.fit_transform(df_train[col])
    df_val[col] = le.transform(df_val[col])
    df_test[col] = le.transform(df_test[col])
    encoders[col] = le

# Multi-label binarizer for recommendations
mlb = MultiLabelBinarizer()
y_train = mlb.fit_transform(df_train['recommendations'])
y_val = mlb.transform(df_val['recommendations'])
y_test = mlb.transform(df_test['recommendations'])
encoders['recommendations'] = mlb

X_train = df_train[feature_cols]
X_val = df_val[feature_cols]
X_test = df_test[feature_cols]

# Train multi-label model
clf = OneVsRestClassifier(RandomForestClassifier(n_estimators=100, random_state=42))
clf.fit(X_train, y_train)

# Validate
val_preds = clf.predict(X_val)
print('Validation Hamming Loss:', hamming_loss(y_val, val_preds))
print('Validation F1 Score (micro):', f1_score(y_val, val_preds, average='micro'))
print('Validation Classification Report:\n', classification_report(y_val, val_preds, target_names=mlb.classes_))

# Test
test_preds = clf.predict(X_test)
print('Test Hamming Loss:', hamming_loss(y_test, test_preds))
print('Test F1 Score (micro):', f1_score(y_test, test_preds, average='micro'))
print('Test Classification Report:\n', classification_report(y_test, test_preds, target_names=mlb.classes_))

# Save model and encoders
joblib.dump(clf, 'recommendation_model.pkl')
joblib.dump(encoders, 'recommendation_encoders.pkl')

print('Model and encoders saved as recommendation_model.pkl and recommendation_encoders.pkl') 