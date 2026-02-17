# ClutterStock – Entity Relationship Diagram

```mermaid
erDiagram
    Location ||--o{ Room : "has"
    Room ||--o{ Item : "contains"

    Location {
        int id PK
        string name
        string description
        datetime created_at
        datetime updated_at
    }

    Room {
        int id PK
        int location_id FK
        string name
        string description
        datetime created_at
        datetime updated_at
    }

    Item {
        int id PK
        int room_id FK
        string name
        string description
        string category
        string notes
        datetime created_at
        datetime updated_at
    }
```

## Relationships

| From   | To     | Cardinality | Description                    |
|--------|--------|-------------|--------------------------------|
| Location | Room  | 1 : N       | One location has many rooms.   |
| Room   | Item   | 1 : N       | One room contains many items.  |

## Notes

- **Location**: Top-level place (e.g. "Home", "Garage", "Storage unit").
- **Room**: Room or zone within a location (e.g. "Garage – workbench", "Office").
- **Item**: Stored thing (electronics, parts, homelab gear, etc.).
