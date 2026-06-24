import type { SpecGuardConfig } from '../engine/adapter'

export interface SampleScenario {
  id: string
  label: string
  description: string
  tag: string
  tagColor: string
  oldContract: string
  newContract: string
  /**
   * Optional governance config for this scenario.
   * Equivalent to specguard.yml — applied automatically when the scenario runs.
   */
  governanceConfig?: SpecGuardConfig
}

export const SCENARIOS: SampleScenario[] = [
  {
    id: 'additive',
    label: 'Safe Additive',
    description: 'New endpoints and optional fields — fully backward compatible',
    tag: 'Non-Breaking',
    tagColor: 'emerald',
    oldContract: `openapi: "3.0.0"
info:
  title: Petstore API
  version: "1.0.0"
  description: A simple petstore API
paths:
  /pets:
    get:
      summary: List all pets
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      type: object
                      required: [id, name, species]
                      properties:
                        id:
                          type: string
                        name:
                          type: string
                        species:
                          type: string
                        age:
                          type: integer
    post:
      summary: Create a pet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, species]
              properties:
                name:
                  type: string
                species:
                  type: string
                age:
                  type: integer
      responses:
        "201":
          description: Pet created
  /pets/{id}:
    get:
      summary: Get a pet by ID
      responses:
        "200":
          description: A single pet
          content:
            application/json:
              schema:
                type: object
                required: [id, name, species]
                properties:
                  id:
                    type: string
                  name:
                    type: string
                  species:
                    type: string
                  age:
                    type: integer
        "404":
          description: Pet not found`,

    newContract: `openapi: "3.0.0"
info:
  title: Petstore API
  version: "1.1.0"
  description: A simple petstore API
paths:
  /pets:
    get:
      summary: List all pets
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      type: object
                      required: [id, name, species]
                      properties:
                        id:
                          type: string
                        name:
                          type: string
                        species:
                          type: string
                        age:
                          type: integer
                        nickname:
                          type: string
    post:
      summary: Create a pet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, species]
              properties:
                name:
                  type: string
                species:
                  type: string
                age:
                  type: integer
                nickname:
                  type: string
      responses:
        "201":
          description: Pet created
  /pets/{id}:
    get:
      summary: Get a pet by ID
      responses:
        "200":
          description: A single pet
          content:
            application/json:
              schema:
                type: object
                required: [id, name, species]
                properties:
                  id:
                    type: string
                  name:
                    type: string
                  species:
                    type: string
                  age:
                    type: integer
                  nickname:
                    type: string
        "404":
          description: Pet not found
  /pets/{id}/health:
    get:
      summary: Get health record for a pet
      responses:
        "200":
          description: Health record
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum: [healthy, sick, critical]
                  last_checkup:
                    type: string
        "404":
          description: Pet not found
  /breeds:
    get:
      summary: List all breeds
      responses:
        "200":
          description: A list of breeds`,
  },

  {
    id: 'breaking-removal',
    label: 'Breaking Removal',
    description: 'Endpoints and required fields removed — clients will break',
    tag: 'Breaking',
    tagColor: 'red',
    oldContract: `openapi: "3.0.0"
info:
  title: E-Commerce API
  version: "2.0.0"
paths:
  /users:
    post:
      summary: Create a user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, username]
              properties:
                email:
                  type: string
                username:
                  type: string
                full_name:
                  type: string
      responses:
        "201":
          description: User created
          content:
            application/json:
              schema:
                type: object
                required: [id, email, username]
                properties:
                  id:
                    type: string
                  email:
                    type: string
                  username:
                    type: string
                  full_name:
                    type: string
  /products/{id}:
    get:
      summary: Get a product
      responses:
        "200":
          description: Product details
          content:
            application/json:
              schema:
                type: object
                required: [id, name, price]
                properties:
                  id:
                    type: string
                  name:
                    type: string
                  price:
                    type: number
                  discount_price:
                    type: number
                  in_stock:
                    type: boolean
        "404":
          description: Not found
    delete:
      summary: Delete a product
      responses:
        "204":
          description: Deleted
        "404":
          description: Not found
  /orders:
    post:
      summary: Place an order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [user_id, product_ids]
              properties:
                user_id:
                  type: string
                product_ids:
                  type: array
                  items:
                    type: string
                coupon_code:
                  type: string
      responses:
        "201":
          description: Order placed
        "400":
          description: Invalid request`,

    newContract: `openapi: "3.0.0"
info:
  title: E-Commerce API
  version: "3.0.0"
paths:
  /users:
    post:
      summary: Create a user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [username]
              properties:
                username:
                  type: string
                full_name:
                  type: string
      responses:
        "201":
          description: User created
          content:
            application/json:
              schema:
                type: object
                required: [id, username]
                properties:
                  id:
                    type: string
                  username:
                    type: string
                  full_name:
                    type: string
  /orders:
    post:
      summary: Place an order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [user_id, product_ids]
              properties:
                user_id:
                  type: string
                product_ids:
                  type: array
                  items:
                    type: string
                coupon_code:
                  type: string
      responses:
        "201":
          description: Order placed
        "400":
          description: Invalid request
  /inventory:
    get:
      summary: Get inventory levels
      responses:
        "200":
          description: Inventory data`,

    governanceConfig: {
      approvedChanges: [
        {
          type: 'endpointRemoved',
          path: '/products/{id}',
          owner: 'platform-team',
          approvedBy: 'architecture-board',
          reason: 'Products endpoint sunset — consumers migrated to Catalog Service v2 at /catalog/items/{id}. See ADR-2026-04.',
          expires: '2027-06-01',
          createdAt: '2026-01-15',
        },
      ],
      suppressions: [
        {
          rule: 'ENDPOINT_ADDED',
          reason: 'New endpoints are additive and never break existing consumers.',
        },
      ],
    },
  },

  {
    id: 'type-change',
    label: 'Type Change',
    description: 'Field types and enum values changed — subtle but dangerous',
    tag: 'Breaking',
    tagColor: 'red',
    oldContract: `openapi: "3.0.0"
info:
  title: Payments API
  version: "1.0.0"
paths:
  /payments:
    post:
      summary: Create a payment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [amount, currency, method]
              properties:
                amount:
                  type: number
                currency:
                  type: string
                method:
                  type: string
                  enum: [card, bank_transfer, wallet]
                metadata:
                  type: object
      responses:
        "201":
          description: Payment initiated
          content:
            application/json:
              schema:
                type: object
                required: [id, status, amount]
                properties:
                  id:
                    type: string
                  status:
                    type: string
                    enum: [pending, processing, completed, failed]
                  amount:
                    type: number
                  currency:
                    type: string
        "400":
          description: Invalid request
        "402":
          description: Payment required
  /payments/{id}:
    get:
      summary: Get payment status
      responses:
        "200":
          description: Payment details
          content:
            application/json:
              schema:
                type: object
                required: [id, status]
                properties:
                  id:
                    type: string
                  status:
                    type: string
                    enum: [pending, processing, completed, failed]
                  amount:
                    type: number
                  fee:
                    type: number
                  created_at:
                    type: string
        "404":
          description: Not found`,

    newContract: `openapi: "3.0.0"
info:
  title: Payments API
  version: "2.0.0"
paths:
  /payments:
    post:
      summary: Create a payment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [amount, method]
              properties:
                amount:
                  type: string
                currency:
                  type: string
                method:
                  type: string
                  enum: [card, bank_transfer, wallet, crypto]
                metadata:
                  type: object
                reference_id:
                  type: string
      responses:
        "201":
          description: Payment initiated
          content:
            application/json:
              schema:
                type: object
                required: [id, status, amount]
                properties:
                  id:
                    type: string
                  status:
                    type: string
                    enum: [pending, processing, completed]
                  amount:
                    type: string
                  currency:
                    type: string
                  reference_id:
                    type: string
        "400":
          description: Invalid request
  /payments/{id}:
    get:
      summary: Get payment status
      responses:
        "200":
          description: Payment details
          content:
            application/json:
              schema:
                type: object
                required: [id, status]
                properties:
                  id:
                    type: string
                  status:
                    type: string
                    enum: [pending, processing, completed]
                  amount:
                    type: string
                  fee:
                    type: number
                  created_at:
                    type: string
        "404":
          description: Not found`,
  },
]
