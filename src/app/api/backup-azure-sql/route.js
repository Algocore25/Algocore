import { NextResponse } from 'next/server';
import sql from 'mssql';

// Configure your Azure SQL Database connection
const sqlConfig = {
  user: 'sqladmin',
  password: 'AlgoCore@2026Admin',
  database: 'algocoredb',
  server: 'algocore-db-server-4011.database.windows.net',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: false // change to true for local dev / self-signed certs
  }
};

export async function POST(req) {
  try {
    const { tablesData } = await req.json();

    if (!tablesData || typeof tablesData !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Connect to Azure SQL
    console.log("Connecting to Azure SQL...");
    await sql.connect(sqlConfig);
    console.log("Connected successfully!");

    const errors = [];

    // Process each table
    for (const tableName of Object.keys(tablesData)) {
      const records = tablesData[tableName];
      if (!Array.isArray(records) || records.length === 0) continue;

      // Extract dynamic columns from the first object (or combine all)
      const columnSet = new Set();
      records.forEach(r => Object.keys(r).forEach(k => k !== '_id' && columnSet.add(k)));
      const columns = Array.from(columnSet);

      // Clean table name (remove non-alphanumeric to prevent SQL injection/errors)
      const cleanTableName = tableName.replace(/[^a-zA-Z0-9]/g, '');
      if (!cleanTableName) continue;

      try {
        // Drop table if exists to keep it a fresh backup
        const dropQuery = `IF OBJECT_ID('dbo.${cleanTableName}', 'U') IS NOT NULL DROP TABLE dbo.${cleanTableName};`;
        await sql.query(dropQuery);

        // Build CREATE TABLE query
        // Every table will have an ID as primary key. All other columns as NVARCHAR(MAX) to handle dynamic JSON safely
        let createCols = columns.map(c => `[${c.replace(/]/g, '')}] NVARCHAR(MAX)`).join(', ');
        if (createCols.length > 0) createCols = ', ' + createCols;
        
        const createQuery = `CREATE TABLE dbo.${cleanTableName} (_id NVARCHAR(255) PRIMARY KEY ${createCols});`;
        await sql.query(createQuery);
        
        console.log(`Table ${cleanTableName} created schemas: ${columns}`);

        // Insert rows using bulk insert for incredible speed
        const table = new sql.Table(`dbo.${cleanTableName}`);
        table.create = false;
        
        table.columns.add('_id', sql.NVarChar(255), { nullable: false, primary: true });
        columns.forEach(col => {
            table.columns.add(col.replace(/]/g, ''), sql.NVarChar(sql.MAX), { nullable: true });
        });

        for (const record of records) {
            const rowValues = [String(record._id)];
            columns.forEach(col => {
                let val = record[col];
                if (val === null || val === undefined) val = null;
                else if (typeof val === 'object') val = JSON.stringify(val);
                else val = String(val);
                rowValues.push(val);
            });
            table.rows.add(...rowValues);
        }

        const request = new sql.Request();
        await request.bulk(table);

        console.log(`Successfully bulk inserted ${records.length} records into ${cleanTableName}`);
      } catch (tableError) {
        console.error(`Error processing table ${tableName}:`, tableError);
        errors.push(`Table ${tableName}: ${tableError.message}`);
      }
    }

    return NextResponse.json({ success: true, message: 'Backup completed', errors });
  } catch (err) {
    console.error('Backup Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
