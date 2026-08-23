# v0.6 Milestone Backup Record

Backup name: `SalinasOS_v0.6_ExecutiveDashboard.zip`  
Checkpoint date: 2026-08-23  
Application version: `0.6.0`  
Existing Git tag: `v0.6.0`

## Purpose

This archive is a source-and-documentation checkpoint for the Salinas OS v0.6 Executive Dashboard milestone. It is intended to reconstruct the application after installing dependencies and restoring environment configuration through an approved secure channel.

## Packaging Method

The archive is assembled in a temporary directory from:

1. files tracked by the current Git `HEAD`; and
2. the new v0.6 changelog and release documentation created for this checkpoint.

The ZIP is created outside the temporary staging tree. This prevents the archive from including itself and avoids copying ignored local files.

## Explicit Exclusions

- `.git` and Git metadata
- `node_modules`
- `.next` and other generated build output
- `.env`, `.env.local`, and all non-example environment files
- credentials, secrets, access tokens, and local deployment configuration
- macOS metadata and TypeScript incremental-build output
- the milestone ZIP itself

The tracked `.env.example` file is included because it contains variable names and placeholders only, not secret values.

## Restore Procedure

1. Extract the archive into a new directory.
2. Confirm the archive came from an approved internal source.
3. Install the required Node.js version and run `npm ci`.
4. Create `.env.local` through a secure process using the variable names documented in `.env.example`; never reuse values from an untrusted source.
5. Run `npm run build`.
6. Start or deploy the application using the procedures in `README.md`.
7. Validate executive totals against known Asana data and manually test representative client-status previews before management use.

## Verification Requirements

After archive creation:

- confirm the ZIP opens and its file listing can be read;
- confirm required source, lockfile, configuration, README, changelog, and release documentation are present;
- scan archive paths for excluded directories, environment files, credentials, and nested ZIP files;
- record the final archive size and SHA-256 checksum in the completion report; and
- leave the repository uncommitted until explicit approval is provided.

