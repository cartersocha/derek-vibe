# Relationship Synchronization Analysis

## Current State

### Existing Sync Functions

1. **`syncSessionOrganizationsFromCharacters`** (in `organizations.ts`)
   - Gets all characters in a session
   - Gets all organizations of those characters
   - Updates session organizations to match

2. **`syncSessionOrganizationsFromCharacters`** is called in:
   - `updateCharacter` - when a character's organization affiliations change
   - `updateCharacterSessions` - when a character is added/removed from sessions

### Missing Synchronization Points

## ❌ **Problem 1: Session Create/Update doesn't sync organizations from characters**

**Location**: `lib/actions/sessions.ts`

### `createSession` (lines 75-195)
- **Current**: Adds characters to session, but does NOT sync organizations from those characters
- **Issue**: If you add characters with organizations to a new session, the session won't automatically get those organizations
- **Fix Needed**: After adding characters, call `syncSessionOrganizationsFromCharacters`

### `updateSession` (lines 197-399)  
- **Current**: Updates characters, but does NOT sync organizations from those characters
- **Issue**: If you add/remove characters from a session, organizations are not updated
- **Fix Needed**: After updating characters, call `syncSessionOrganizationsFromCharacters`

## ❌ **Problem 2: Character Create doesn't sync to existing sessions**

**Location**: `lib/actions/characters.ts`

### `createCharacter` (lines 42-172)
- **Current**: Creates character with organizations, but doesn't sync to sessions if the character is mentioned
- **Partial Fix**: Has `ensureMentionedSessionsLinked` which syncs for mentioned sessions
- **Issue**: If character is added to sessions later (not through mentions), no sync happens
- **Fix Status**: Mentions work, but needs to be called for non-mention session links

## ❌ **Problem 3: Character Update doesn't sync to all linked sessions**

**Location**: `lib/actions/characters.ts`

### `updateCharacter` (lines 244-382)
- **Current**: Updates character organizations and syncs mentioned sessions
- **Issue**: Only syncs sessions that are mentioned in backstory, not ALL sessions the character is in
- **Fix Needed**: Get all sessions the character is in and sync organizations for all of them

## ✅ **Working: updateCharacterSessions**

**Location**: `lib/actions/characters.ts` (lines 421-474)

- **Current**: Properly syncs organizations when character is explicitly added/removed from sessions
- **Status**: ✅ WORKING CORRECTLY

## Recommended Fixes

### Fix 1: Add organization sync to `createSession`

```typescript
// After inserting session characters (line 142)
if (characterIds.length > 0) {
  const sessionCharacters = characterIds.map((characterId) => ({
    session_id: sessionId,
    character_id: characterId,
  }))

  await supabase.from('session_characters').insert(sessionCharacters)

  // ADD THIS:
  // Sync organizations from characters
  await syncSessionOrganizationsFromCharacters(supabase, sessionId)

  const uniqueCharacterIds = Array.from(new Set(characterIds)).filter(Boolean)
  // ... rest of code
}
```

### Fix 2: Add organization sync to `updateSession`

```typescript
// After updating session characters (line 326)
if (characterIds.length > 0) {
  const sessionCharacters = characterIds.map((characterId) => ({
    session_id: id,
    character_id: characterId,
  }))

  await supabase.from('session_characters').insert(sessionCharacters)
}

// ADD THIS:
// Sync organizations from characters
await syncSessionOrganizationsFromCharacters(supabase, id)

// ... rest of code
```

### Fix 3: Fix `updateCharacter` to sync ALL sessions, not just mentioned ones

```typescript
// After updating character organizations (around line 345)
if (touchedOrganizationIds.length > 0) {
  revalidatePath("/organizations");
  Array.from(new Set(touchedOrganizationIds)).forEach((organizationId) => {
    revalidatePath(`/organizations/${organizationId}`);
  });

  // ADD THIS:
  // Get ALL sessions this character is in
  const { data: characterSessions } = await supabase
    .from('session_characters')
    .select('session_id')
    .eq('character_id', id);

  const sessionIds = characterSessions?.map(sc => sc.session_id) || [];

  // Sync organizations for all sessions
  for (const sessionId of sessionIds) {
    await syncSessionOrganizationsFromCharacters(supabase, sessionId);
    revalidatePath(`/sessions/${sessionId}`);
  }
}
```

## Summary of Changes Needed

| Location | Function | Current Behavior | Fix |
|----------|----------|------------------|-----|
| `sessions.ts` | `createSession` | Doesn't sync orgs from characters | Add sync call after adding characters |
| `sessions.ts` | `updateSession` | Doesn't sync orgs from characters | Add sync call after updating characters |
| `characters.ts` | `updateCharacter` | Only syncs mentioned sessions | Sync ALL sessions character is in |

## Expected Behavior After Fixes

1. **Creating a session with characters**: Session automatically gets organizations from those characters
2. **Adding characters to existing session**: Session automatically gets organizations from new characters
3. **Removing characters from session**: Session organizations are recalculated
4. **Updating character organizations**: All sessions with that character get updated organizations
5. **Character mentions session in backstory**: Organizations sync (already works)

## Priority

🔴 **HIGH**: These are core relationship synchronization issues that affect data consistency.

