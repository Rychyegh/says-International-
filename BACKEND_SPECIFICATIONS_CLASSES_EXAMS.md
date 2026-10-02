# Backend Implementation Specifications: Class Levels, Sub-Class Levels & Exam Registrations

This document outlines the API endpoints, database schemas, and payload specifications required from the backend team to fully support dynamic Class Levels, Sub-Class Level mappings, Subject catalogs, and Student Exam Candidate details across the REMALJ Carewell portal.

---

## 1. Class Levels & Sub-Class Levels Management

### 1.1 Overview & Requirements
The frontend provides a two-field modal for configuring classes:
1. **Class Level Name** (e.g., `Creche`, `Basic 1`, `Basic 2`, ..., `Basic 9`, `SHS 1`, `Primary 7`)
2. **Sub-Class Level Name** (e.g., `Basic 1A`, `Basic 1B`, `Gold`, `Emerald`, `Creche Red`)

Adding a new sub-class with a class selected maps that sub-class directly to that specific class level across the entire school system.

---

### 1.2 Recommended Database Schema

#### A. `academic_classes` Table
Stores high-level class levels.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique class level ID |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Class level name (e.g., "Basic 1", "Creche") |
| `category` | `VARCHAR(50)` | Default `'Primary School'` | Stream / division (e.g., "Creche & Early Years", "Primary School", "JHS", "SHS") |
| `created_at` | `TIMESTAMPTZ` | Default `NOW()` | Record creation timestamp |

```sql
CREATE TABLE academic_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'Primary School',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### B. `academic_subclasses` Table
Stores sub-class sections and maps them directly to parent class levels.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique sub-class ID |
| `class_id` | `UUID` | `REFERENCES academic_classes(id) ON DELETE CASCADE` | Foreign key to parent class |
| `class_name`| `VARCHAR(100)` | `NOT NULL` | Parent class name for fast denormalized lookups |
| `name` | `VARCHAR(100)` | `NOT NULL` | Sub-class section name (e.g., "Basic 1A", "Gold") |
| `created_at` | `TIMESTAMPTZ` | Default `NOW()` | Record creation timestamp |
| `CONSTRAINT` | `UNIQUE(class_name, name)` | | Prevent duplicate subclasses within the same class |

```sql
CREATE TABLE academic_subclasses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES academic_classes(id) ON DELETE CASCADE,
    class_name VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_class_subclass UNIQUE(class_name, name)
);
```

---

### 1.3 Endpoints for Classes & Sub-Classes

#### 1. Fetch Class Levels
- **Method**: `GET`
- **Route**: `/academic/catalog/classes`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "classes": [
    { "id": "uuid-1", "name": "Creche", "category": "Creche & Early Years" },
    { "id": "uuid-2", "name": "Basic 1", "category": "Primary School" },
    { "id": "uuid-3", "name": "Basic 9", "category": "Junior High School (JHS)" }
  ]
}
```

#### 2. Create New Class Level
- **Method**: `POST`
- **Route**: `/academic/catalog/classes`
- **Request Body**:
```json
{
  "name": "Primary 7",
  "category": "Primary School"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Class level created successfully",
  "data": {
    "id": "c4d12e80-77a8-4c22-b5e2-63b78297d022",
    "name": "Primary 7",
    "category": "Primary School"
  }
}
```

#### 3. Fetch Sub-Class Levels (with Class Mappings)
- **Method**: `GET`
- **Route**: `/academic/catalog/subclasses`
- **Query Params (Optional)**: `?className=Basic%201`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "subclasses": [
    { "id": "sc-1", "className": "Basic 1", "name": "Basic 1A" },
    { "id": "sc-2", "className": "Basic 1", "name": "Basic 1B" },
    { "id": "sc-3", "className": "Basic 1", "name": "Basic 1C" },
    { "id": "sc-4", "className": "Creche", "name": "Creche Gold" }
  ]
}
```

#### 4. Create & Map New Sub-Class Level
- **Method**: `POST`
- **Route**: `/academic/catalog/subclasses`
- **Request Body**:
```json
{
  "className": "Basic 1",
  "name": "Basic 1C"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Sub-class created and mapped successfully",
  "data": {
    "id": "e8a913bc-5b58-45e6-9907-28d8495fce21",
    "className": "Basic 1",
    "name": "Basic 1C"
  }
}
```

---

## 2. Subjects Catalog

### 2.1 Endpoints for Subjects

#### 1. Fetch Subjects Catalog
- **Method**: `GET`
- **Route**: `/academic/catalog/subjects`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "subjects": [
    { "name": "Mathematics" },
    { "name": "English Language" },
    { "name": "Integrated Science" },
    { "name": "French" },
    { "name": "Social Studies" }
  ]
}
```

#### 2. Create New Subject
- **Method**: `POST`
- **Route**: `/academic/catalog/subjects`
- **Request Body**:
```json
{
  "name": "Robotics & AI"
}
```

---

## 3. Examination Candidate Registrations

Ensure the exam registration table and endpoints persist and return both `sub_class` (or `subClass`) and `gender`:

### 3.1 Schema Requirements for `exam_registrations`
| Column | Type | Description |
|---|---|---|
| `student_id` | `VARCHAR(100)` / `UUID` | Student identifier / uuid |
| `student_name` | `VARCHAR(200)` | Full name of the candidate |
| `class_level` | `VARCHAR(100)` | Candidate class level |
| `sub_class` | `VARCHAR(100)` | Candidate sub-class (e.g., "Basic 9A") |
| `gender` | `VARCHAR(20)` | "Male" / "Female" |
| `index_number` | `VARCHAR(100)` | Candidate examination index number |
| `exam_type` | `VARCHAR(150)` | e.g. "End-of-Term Final Examination" |
| `exam_center` | `VARCHAR(150)` | e.g. "Main Examination Hall A" |
| `subjects` | `JSONB` / `TEXT[]` | List of registered subjects |

### 3.2 Registration API Payload (POST `/academic/exam-registrations`)
```json
{
  "studentId": "2f87a8cb-288b-4456-a8a5-ce45f21d35b3",
  "studentName": "Danquah gyimah mark",
  "classLevel": "Basic 9",
  "subClass": "Basic 9A",
  "gender": "Male",
  "indexNumber": "EXAM-2025-BASIC9-80B2E00AB2A4",
  "examType": "End-of-Term Final Examination",
  "examCenter": "Main Examination Hall A",
  "academicYear": "2025/2026",
  "term": "Term 1",
  "subjects": ["Mathematics", "English Language", "Integrated Science", "Social Studies"]
}
```
