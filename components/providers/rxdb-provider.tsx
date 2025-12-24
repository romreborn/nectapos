"use client";

import { useEffect, useState } from "react";
import { Provider } from "rxdb-hooks";
import { createRxDatabase, addRxPlugin, RxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { wrappedValidateZSchemaStorage } from "rxdb/plugins/validate-z-schema";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { schemas } from "@/lib/database/schema";
import { supabase } from "@/lib/supabase";
// Note: rxdb-supabase may have naming differences. Trying wildcard import.
import * as RxdbSupabase from "rxdb-supabase";

// Add plugins
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

const dbName = "nectapos_db";

export function RxdbProvider({ children }: { children: React.ReactNode }) {
    const [db, setDb] = useState<RxDatabase | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

    useEffect(() => {
        let replicationState: any = null;

        const initDB = async () => {
            if (typeof window === "undefined") return;

            try {
                const _db = await createRxDatabase({
                    name: dbName,
                    storage: wrappedValidateZSchemaStorage({
                        storage: getRxStorageDexie()
                    }),
                });

                await _db.addCollections({
                    products: { schema: schemas.products },
                    transactions: { schema: schemas.transactions }
                });

                // TODO: Fix rxdb-supabase replication
                // The rxdb-supabase package export structure is different than expected
                // For now, replication is disabled - data will only be stored locally
                // Supabase Replication for Products
                // replicationState = await (RxdbSupabase as any).replicateSupabase({
                //     replicationIdentifier: 'products-replication',
                //     supabaseClient: supabase as any,
                //     collection: _db.products,
                //     table: 'products',
                //     pull: {
                //         realtimePostgresChanges: true,
                //     },
                //     push: {
                //         batchSize: 1
                //     }
                // });

                // replicationState.active$.subscribe((active: boolean) => {
                //     setSyncStatus(active ? 'syncing' : 'idle');
                // });

                // replicationState.error$.subscribe((err: any) => {
                //     console.error('Replication Error:', err);
                //     setSyncStatus('error');
                // });

                setDb(_db);
                console.log("RxDB Initialized (Replication temporarily disabled)");
            } catch (err: any) {
                console.error("RxDB Initialization Error:", err);

                // If schema mismatch, delete the database and reload
                if (err.code === 'DB6' || err.message?.includes('different schema')) {
                    console.log("Schema mismatch detected. Clearing old database...");

                    // Delete IndexedDB database
                    if (typeof window !== 'undefined' && window.indexedDB) {
                        const deleteRequest = window.indexedDB.deleteDatabase(dbName);
                        deleteRequest.onsuccess = () => {
                            console.log("Database deleted. Reloading page...");
                            window.location.reload();
                        };
                        deleteRequest.onerror = () => {
                            console.error("Failed to delete database");
                        };
                    }
                }
            }
        };

        initDB();

        return () => {
            if (replicationState) {
                replicationState.cancel();
            }
        };
    }, []);

    if (!db) {
        return <div className="flex items-center justify-center h-screen">Starting POS Database...</div>;
    }

    return <Provider db={db as any}>{children}</Provider>;
}
