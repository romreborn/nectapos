declare module 'rxdb-supabase' {
    // import { RxCollection, ReplicationOptions } from 'rxdb';
    type RxCollection = any;
    type ReplicationOptions = any;
    import { SupabaseClient } from '@supabase/supabase-js';

    export type SupabaseReplicationOptions<RxDocType> = {
        supabaseClient: SupabaseClient;
        collection: RxCollection<RxDocType>;
        table: string;
        replicationIdentifier: string;
        pull?: any; // Define strictly if needed
        push?: any; // Define strictly if needed
    };

    export function replicateSupabase<RxDocType>(
        options: SupabaseReplicationOptions<RxDocType>
    ): Promise<any>; // Returns replication state
}
