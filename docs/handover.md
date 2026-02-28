graph TD
    subgraph "Phase 1: Foundation"
        DB["Neon Database"] --> Queue["scrape_queue table"]
        Queue --> Init["sc_01_init_queue.js"]
    end

    subgraph "Phase 2: Discovery"
        Init --> Discover["sc_02_discover.js"]
        Discover --> SearchAPI["DataForSEO search/live"]
        SearchAPI --> BizTable["businesses table"]
    end

    subgraph "Phase 3: Enrichment"
        BizTable --> Enrich["sc_03_enrich.js"]
        Enrich --> ReviewAPI["DataForSEO task_post/get"]
        ReviewAPI --> ReviewTable["business_reviews table"]
    end

    subgraph "Phase 4: Optimization"
        ReviewTable --> Frontend["Next.js Business Pages"]
        Frontend --> SEO["SEO Boost (Real Reviews)"]
    end

    Master["sc_master_national.js"] -- "Controls" --> Phase1
    Master -- "Controls" --> Phase2
    Master -- "Controls" --> Phase3
    Master -- "Controls" --> Status["sc_04_status.js"]

    classDef success fill:#9f9,stroke:#333,stroke-width:2px;
    classDef pending fill:#f96,stroke:#333,stroke-width:2px;
    
    class DB,Queue,Init,Discover,SearchAPI,BizTable,Enrich,ReviewAPI,ReviewTable,Master,Status success;
    class Frontend,SEO pending;
