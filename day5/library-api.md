# Library Books REST API Design

## Overview

This API manages a library's book collection. It supports listing, finding, creating, updating, and deleting books, as well as searching by author.

Base URL: `/api/v1`

### Example book resource

```json
{
  "id": 1,
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958,
  "available": true
}
```

## Endpoints

### 1. List all books

- **Method:** `GET`
- **Path:** `/api/v1/books`
- **Description:** Returns a list of all books.
- **Success status:** `200 OK`
- **Example request body:** None required.

### 2. Get one book

- **Method:** `GET`
- **Path:** `/api/v1/books/1`
- **Description:** Returns the book with ID `1`.
- **Success status:** `200 OK`
- **Example request body:** None required.

### 3. Create a book

- **Method:** `POST`
- **Path:** `/api/v1/books`
- **Description:** Creates a new book in the collection.
- **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958,
  "available": true
}
```

- **Success status:** `201 Created`

### 4. Update a book

- **Method:** `PUT`
- **Path:** `/api/v1/books/1`
- **Description:** Replaces the editable details of book `1`.
- **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958,
  "available": false
}
```

- **Success status:** `200 OK`

### 5. Delete a book

- **Method:** `DELETE`
- **Path:** `/api/v1/books/1`
- **Description:** Deletes book `1` from the collection.
- **Success status:** `204 No Content`
- **Example request body:** None required.

### 6. List books by author

- **Method:** `GET`
- **Path:** `/api/v1/books?author=Chinua%20Achebe`
- **Description:** Returns books whose author matches the supplied author query parameter.
- **Success status:** `200 OK`
- **Example request body:** None required.

## Error Responses

### `400 Bad Request`

The request is invalid or contains incorrect data.

**Example:** A client tries to create a book without a title or author.

### `404 Not Found`

The requested resource does not exist.

**Example:** A client requests `GET /api/v1/books/999` when no book has ID `999`.
