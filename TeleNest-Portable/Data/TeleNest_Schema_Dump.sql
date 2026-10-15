-- ===============================================================================
-- TeleNest ICT Enterprise - SQL Database Schema & Snapshot Dump
-- Architecture: Bilal Ahmed (TeleNest ICT Logistics & Telecom Engineering)
-- Generated: 2026-09-20T15:07:38.365Z
-- Safe Work File Target: C:\Database safe work files\TeleNest_Schema_Dump.sql
-- ===============================================================================

CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
    min_threshold NUMERIC(12,2) NOT NULL DEFAULT 10,
    unit VARCHAR(32) NOT NULL,
    depot VARCHAR(128) NOT NULL,
    location VARCHAR(128),
    unit_cost NUMERIC(12,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(64) PRIMARY KEY,
    item_id VARCHAR(64) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    movement_type VARCHAR(32) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    from_depot VARCHAR(128),
    to_depot VARCHAR(128),
    assigned_to VARCHAR(128),
    timestamp VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_projects (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    project_type VARCHAR(64) NOT NULL,
    zone VARCHAR(128),
    status VARCHAR(64) NOT NULL,
    budget NUMERIC(12,2) DEFAULT 0.00,
    spent NUMERIC(12,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS operational_expenses (
    id VARCHAR(64) PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    date VARCHAR(32) NOT NULL
);

-- Active items count: 8
-- Movements logged: 3
-- Projects active: 4
-- Expenses logged: 16
-- Generated for Safe Storage in C:\Database safe work files\
