# Shared List Permissions

This repo now uses a relation-based permission model for shared lists.

## PocketBase collections

`user_shared_list`
- Links a user to a shared list.
- Stores `fk_user_id`, `fk_shared_list_id`, and `fk_permission_id`.
- Does not carry the source-of-truth permission flags directly.

`permission`
- Stores the effective permission for a membership.
- Important fields:
  - `name`: `admin` | `editor` | `viewer`
  - `add`: can add anime to the shared list
  - `modify`: can edit anime entries
  - `delete`: can delete anime entries
  - `add_user`: can manage members
  - `delete_user`: can remove members

`anime_shared_list`
- Uses PocketBase rules that reference the linked `permission` record.
- `createRule` should rely on `fk_permission_id.add ?= true`.
- `updateRule` should rely on `fk_permission_id.modify ?= true`.
- `deleteRule` should rely on `fk_permission_id.delete ?= true`.

## Frontend behavior

The shared-list composable in `app/composables/useSharedLists.ts`:
- reads permissions from `expand.fk_permission_id`
- creates a `permission` record before creating a `user_shared_list` record
- updates member roles by updating the linked `permission` record
- migrates legacy memberships that are missing a valid `fk_permission_id`

The shared-list detail page in `app/pages/sharedLists/[id].vue`:
- runs legacy membership migration when the owner opens the list
- reloads the page data after a successful migration pass

## Important note

`public/database.json` is only an exported schema snapshot.
If you change rules or fields there, you still need to apply the same changes in the live PocketBase admin.
