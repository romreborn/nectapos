import {
    ExtractDocumentTypeFromTypedRxJsonSchema,
    toTypedRxJsonSchema,
    RxJsonSchema
} from 'rxdb';

// Schema types derived from usage (or we can duplicate types/zod). 
// For RxDB, simpler schema is better, then we replicate with Supabase.

export const PRODUCTS_SCHEMA_LITERAL = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100 // RxDB requires maxLength for primary key
        },
        shop_id: {
            type: 'string'
        },
        sku: {
            type: ['string', 'null']
        },
        name: {
            type: 'string'
        },
        price: {
            type: 'number'
        },
        stock_qty: {
            type: 'integer'
        },
        is_custom: {
            type: 'boolean'
        },
        created_at: {
            type: 'string'
        },
        updated_at: {
            type: 'string'
        }
    },
    required: ['id', 'shop_id', 'name', 'price', 'stock_qty', 'is_custom', 'created_at', 'updated_at']
} as const;

export const TRANSACTIONS_SCHEMA_LITERAL = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        shop_id: {
            type: 'string'
        },
        total_amount: {
            type: 'number',
            multipleOf: 0.01
        },
        status: {
            type: 'string',
            maxLength: 50
        },
        created_at: {
            type: 'string'
        },
        is_synced: {
            type: 'boolean', // Local flag to check sync status if needed
            default: false
        }
    },
    required: ['id', 'total_amount']
} as const;


const productsSchemaTyped = toTypedRxJsonSchema(PRODUCTS_SCHEMA_LITERAL);
export type ProductDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof productsSchemaTyped>;
// export type ProductDocType = any;

const transactionsSchemaTyped = toTypedRxJsonSchema(TRANSACTIONS_SCHEMA_LITERAL);
export type TransactionDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof transactionsSchemaTyped>;
// export type TransactionDocType = any;






export const schemas = {
    products: PRODUCTS_SCHEMA_LITERAL,
    transactions: TRANSACTIONS_SCHEMA_LITERAL,
    // ... add other tables
};
