# PCGH Reputation Engine

## Overview

The PCGH Reputation Engine measures the health, quality, consistency, and trustworthiness of members, creators, and communities.

The purpose of reputation is not punishment.

Its purpose is to:

* Measure participation quality
* Measure consistency
* Measure authenticity
* Measure amplification performance
* Improve platform health
* Support recognition systems

---

# Member Reputation

Member reputation is visible only to administrators.

Members see only simplified standings.

## Reputation Factors

### Activity Score

Measures:

* Views
* Visits
* Shares
* Saves

### Consistency Score

Measures:

* Daily participation
* Weekly participation
* Monthly participation

### Authenticity Score

Measures:

* Natural behavior
* Diversity
* Spam detection
* Pattern analysis

### Participation Score

Measures:

* Discoveries received
* Discoveries participated in

---

## Final Member Reputation Formula

```text
Activity
+
Consistency
+
Authenticity
+
Participation
=
Final Score
```

---

## Reputation Categories

95-100
Elite

85-94
Excellent

70-84
Good

50-69
Average

0-49
Low

---

## member_reputation

```text
id

user_id

activity_score

consistency_score

authenticity_score

participation_score

final_score

updated_at
```

---

# Creator Reputation

Creator reputation measures creator quality and amplification effectiveness.

## Reputation Factors

### Campaign Quality

* Campaign completion
* Content quality
* Distribution success

### Community Performance

* Community participation
* Community retention
* Community response

### Consistency

* Campaign frequency
* Creator activity
* Creator reliability

### Amplification

* Reach
* Shares
* Saves
* Visits

---

## Final Creator Reputation Formula

```text
Campaign Quality
+
Community Performance
+
Consistency
+
Amplification
=
Final Score
```

---

## Creator Categories

95-100
Elite Creator

85-94
Excellent Creator

70-84
Good Creator

50-69
Average Creator

0-49
Low Creator

---

## creator_reputation

```text
id

creator_id

campaign_quality_score

community_performance_score

consistency_score

amplification_score

final_score

updated_at
```

---

# Community Reputation

Community reputation measures community health and effectiveness.

## Reputation Factors

### Participation

* Assigned discoveries
* Participated discoveries

### Consistency

* Daily activity
* Weekly activity
* Monthly activity

### Authenticity

* Natural behavior
* Diversity
* Spam detection

### Health

* Active members
* Retention
* Community stability

### Amplification

* Views
* Shares
* Saves
* Visits

---

## Final Community Reputation Formula

```text
Participation
+
Consistency
+
Authenticity
+
Health
+
Amplification
=
Final Score
```

---

## Community Categories

95-100
Elite Community

85-94
Excellent Community

70-84
Good Community

50-69
Average Community

0-49
Low Community

---

## community_reputation

```text
id

community_id

participation_score

consistency_score

authenticity_score

health_score

amplification_score

final_score

updated_at
```

---

# Visibility Rules

| Entity               | Admin | Owner         | Others   |
| -------------------- | ----- | ------------- | -------- |
| Member Reputation    | Full  | Standing Only | No       |
| Creator Reputation   | Full  | Standing Only | Optional |
| Community Reputation | Full  | Standing Only | Optional |

```
```

