`https://api.example.com/statement`

The API should return a **JSON array** of statement objects.

```json
Array<Statement>
```
Each statement object should have the following fields:

```json
{
  "firstName": "string",
  "lastName": "string",
  "loadId": "string",
  "rate": "number",
  "driverPay": "number",
  "status": "string"
}
```

## Field Details

| Field | Type | Required | Description | Display Format |
|-------|------|----------|-------------|----------------|
| `firstName` | string | Yes | Driver's first name | "Name: {firstName} {lastName}" |
| `lastName` | string | Yes | Driver's last name | "Name: {firstName} {lastName}" |
| `loadId` | string | Yes | Unique identifier for the load | "Load ID: {loadId}" |
| `rate` | number | No | Rate amount (will show "N/A" if missing) | "$ {rate}" or "$ N/A" |
| `driverPay` | number | No | Driver payment amount (will show "N/A" if missing) | "$ {driverPay}" or "$ N/A" |
| `status` | string | No | Status of the statement | Color-coded tag |

## Status Values

The `status` field can have the following values (color-coded):

- `"Completed"` → **Green** tag
- `"Pending"` → **Orange** tag
- `"Canceled"` → **Red** tag
- Any other value → **Blue** tag

## Example API Response

```json
[
  {
    "firstName": "John",
    "lastName": "Doe",
    "loadId": "LD-2024-001",
    "rate": 1500,
    "driverPay": 1200,
    "status": "Completed"
  },
  {
    "firstName": "Jane",
    "lastName": "Smith",
    "loadId": "LD-2024-002",
    "rate": 2000,
    "driverPay": 1800,
    "status": "Pending"
  },
  {
    "firstName": "Bob",
    "lastName": "Johnson",
    "loadId": "LD-2024-003",
    "rate": 1750,
    "driverPay": null,
    "status": "Canceled"
  }
]
```

## What Users Will See

Each statement will be displayed as a **single line** with the following information:

1. **Name**: First Name + Last Name (combined)
2. **Load ID**: The load identifier
3. **Rate**: Dollar amount (formatted as currency)
4. **Driver Pay**: Dollar amount (formatted as currency)
5. **Status**: Color-coded tag (Completed/Pending/Canceled)

### Display Format Example:

```
Name: John Doe  |  Load ID: LD-2024-001  |  Rate: $1500  |  Driver Pay: $1200  |  [Completed] (green tag)
```

## Features

- ✅ Pagination: 10 items per page (configurable)
- ✅ Loading state: Shows spinner while fetching
- ✅ Empty state: Shows "No data available" if array is empty
- ✅ Error handling: Logs errors to console
- ✅ Single-line display: All data on one line per item
- ✅ Responsive: Adapts to screen size
- ✅ Dark/Light theme support

## Notes

- The API should return an empty array `[]` if there are no statements
- Missing `rate` or `driverPay` will display as "N/A"
- Missing `status` will not show a tag
- The `loadId` is used as the unique key for React rendering

