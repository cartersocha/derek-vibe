# Color Consolidation Specification & Implementation Plan

## Overview
This specification mandates the complete elimination of hardcoded color values throughout the application in favor of a centralized CSS variable system. All colors must be defined as CSS custom properties and referenced consistently across all components.

## Requirements

### 1. CSS Variable System (MANDATORY)
- **ALL colors must use CSS variables** - No hardcoded hex, rgb, or named colors allowed
- **Centralized color definitions** in `app/globals.css`
- **Semantic naming** for color variables (e.g., `--cyber-cyan`, `--semantic`)
- **Consistent opacity handling** using CSS variables with `/opacity` syntax

### 2. Prohibited Color Patterns
The following patterns are **FORBIDDEN** and must be replaced:
```css
/* FORBIDDEN - Hardcoded hex colors */
color: #00ffff;
background: #1a1a3e;
border: 1px solid #ff00ff;

/* FORBIDDEN - Hardcoded RGB */
color: rgb(0, 255, 255);
background: rgba(26, 26, 62, 0.5);

/* FORBIDDEN - Tailwind color classes */
text-gray-400
bg-blue-500
border-red-300

/* FORBIDDEN - Hardcoded color values in Tailwind arbitrary values */
text-[#00ffff]
bg-[#1a1a3e]
border-[#ff00ff]
```

### 3. Required Color Variable System

#### Core Cyberpunk Palette (4 colors)
```css
:root {
  --cyber-cyan: #00ffff;
  --cyber-magenta: #ff00ff;
  --bg-dark: #0a0a1f;
  --bg-card: #1a1a3e;
}
```

#### Text Hierarchy (3 colors)
```css
:root {
  --text-primary: #ededed;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
}
```

#### Semantic Color (1 color - use with opacity variations)
```css
:root {
  --semantic: #ff00ff;
}
```

### 4. Implementation Standards

#### Required CSS Variable Usage
```css
/* REQUIRED - Use CSS variables */
color: var(--cyber-cyan);
background: var(--bg-card);
border: 1px solid var(--cyber-magenta);

/* REQUIRED - Opacity with variables */
background: var(--cyber-cyan)/10;
border: 1px solid var(--semantic)/70;
```

#### Required Tailwind Usage
```css
/* REQUIRED - Tailwind with CSS variables */
text-[var(--cyber-cyan)]
bg-[var(--bg-card)]
border-[var(--cyber-magenta)]

/* REQUIRED - Opacity with variables */
bg-[var(--cyber-cyan)]/10
border-[var(--semantic)]/70
```

### 5. Hover Effects Standardization
All hover effects must use CSS utility classes:
```css
/* REQUIRED - Standardized hover effects */
.hover-cyber { /* Defined in globals.css */ }
.hover-brightness { /* Defined in globals.css */ }
.hover-glow { /* Defined in globals.css */ }
.hover-lift { /* Defined in globals.css */ }
```

### 6. Component Color Mapping

#### Character Components
- **Player characters**: `var(--cyber-cyan)` with `hover-cyber`
- **NPC characters**: `var(--cyber-magenta)` with `hover-cyber`
- **Character details**: `var(--text-primary)`, `var(--text-secondary)`

#### Organization/Group Components
- **All group pills**: `var(--semantic)` with `hover-brightness`
- **Organization cards**: `var(--bg-card)` background
- **Organization borders**: `var(--cyber-cyan)` with opacity

#### Session Components
- **Session names**: `var(--cyber-cyan)` with `hover-cyber`
- **Session numbers**: `var(--cyber-magenta)` with `hover-brightness`
- **Session notes**: `var(--text-primary)` on `var(--bg-dark)`

#### Campaign Components
- **Campaign names**: `var(--cyber-cyan)` with `hover-cyber`
- **Campaign descriptions**: `var(--text-primary)`
- **Session pills**: `var(--cyber-cyan)` with `hover-cyber`

### 7. File-by-File Implementation Plan

#### Phase 1: Core Components (COMPLETED ✅)
- [x] `app/globals.css` - CSS variable definitions
- [x] `lib/utils/styles.ts` - Style utilities
- [x] `lib/mention-utils.tsx` - @ mention colors
- [x] `components/ui/session-participant-pills.tsx` - Organization pills
- [x] `components/ui/session-character-card.tsx` - Character cards
- [x] `components/ui/dashboard-session-card.tsx` - Dashboard cards
- [x] `components/ui/campaign-session-card.tsx` - Campaign session cards
- [x] `components/ui/character-session-card.tsx` - Character session cards
- [x] `components/ui/mentionable-textarea.tsx` - Textarea colors
- [x] `app/organizations/[id]/page.tsx` - Organization detail page
- [x] `app/sessions/[id]/page.tsx` - Session detail page
- [x] `app/characters/page.tsx` - Character index page
- [x] `app/characters/[id]/page.tsx` - Character detail page
- [x] `app/dashboard/page.tsx` - Dashboard page
- [x] `components/ui/campaigns-index.tsx` - Campaign index
- [x] `components/ui/character-search.tsx` - Character search
- [x] `components/ui/organizations-index.tsx` - Organization index

#### Phase 2: Remaining Components (IN PROGRESS 🔄)
- [ ] `components/layout/topbar.tsx` - Top navigation
- [ ] `components/layout/navbar.tsx` - Side navigation
- [ ] `components/ui/synthwave-dropdown.tsx` - Dropdown components
- [ ] `components/ui/index-utility.tsx` - Index utilities
- [ ] `components/ui/session-multi-select.tsx` - Multi-select components
- [ ] `components/ui/organization-multi-select.tsx`
- [ ] `components/ui/character-multi-select.tsx`
- [ ] `components/ui/campaign-multi-select.tsx`
- [ ] `components/ui/entity-multi-select.tsx`
- [ ] `components/ui/creatable-select.tsx`
- [ ] `components/ui/simple-session-multi-select.tsx`
- [ ] `components/ui/simple-character-multi-select.tsx`
- [ ] `components/ui/simple-campaign-multi-select.tsx`
- [ ] `components/ui/multi-select-dropdown.tsx`
- [ ] `components/ui/synthwave-select.tsx`
- [ ] `components/ui/image-upload.tsx`

#### Phase 3: Form Components (PENDING ⏳)
- [ ] `components/forms/character-edit-form.tsx`
- [ ] `components/forms/new-character-form.tsx`
- [ ] `components/forms/campaign-form.tsx`
- [ ] `components/forms/session-form.tsx`
- [ ] `components/organizations/organization-form.tsx`
- [ ] `components/forms/character-organization-field.tsx`

#### Phase 4: Page Components (PENDING ⏳)
- [ ] `app/sessions/new/page.tsx`
- [ ] `app/sessions/[id]/edit/page.tsx`
- [ ] `app/organizations/new/page.tsx`
- [ ] `app/organizations/[id]/edit/page.tsx`
- [ ] `app/characters/new/page.tsx`
- [ ] `app/characters/[id]/edit/page.tsx`
- [ ] `app/campaigns/new/page.tsx`
- [ ] `app/campaigns/[id]/edit/page.tsx`

#### Phase 5: Utility Components (PENDING ⏳)
- [ ] `components/ui/delete-organization-button.tsx`
- [ ] `components/ui/delete-session-button.tsx`
- [ ] `components/ui/delete-character-button.tsx`
- [ ] `components/ui/delete-campaign-button.tsx`

### 8. Quality Assurance

#### Automated Checks
- **Linting rules** to catch hardcoded colors
- **CSS variable validation** in build process
- **Color consistency audits** across components

#### Manual Verification
- **Visual consistency** across all pages
- **Hover state uniformity** throughout the app
- **Accessibility compliance** with color contrast ratios

### 9. Success Criteria

#### Completion Metrics
- **Zero hardcoded colors** in codebase
- **100% CSS variable usage** for all colors
- **Consistent hover effects** across all components
- **No linting errors** related to color usage

#### Performance Requirements
- **No performance impact** from CSS variable usage
- **Maintainable color system** for future updates
- **Easy theme switching** capability (if needed)

### 10. Maintenance Guidelines

#### Adding New Colors
1. **Define in CSS variables** first
2. **Add to style utilities** if needed
3. **Update documentation** with new color
4. **Test across all components** that might use it

#### Modifying Existing Colors
1. **Update CSS variable** in `globals.css`
2. **Verify all usages** are using variables
3. **Test visual consistency** across app
4. **Update documentation** if needed

## Implementation Status

### Current Progress
- **Phase 1**: ✅ COMPLETED (Core components updated)
- **Phase 2**: 🔄 IN PROGRESS (Remaining components)
- **Phase 3**: ⏳ PENDING (Form components)
- **Phase 4**: ⏳ PENDING (Page components)
- **Phase 5**: ⏳ PENDING (Utility components)

### Hardcoded Color Count
- **Initial**: 449 hardcoded colors
- **Current**: 399 hardcoded colors
- **Reduced by**: 50 colors (11% reduction)
- **Target**: 0 hardcoded colors

### Next Steps
1. **Complete Phase 2** - Update remaining UI components
2. **Begin Phase 3** - Update form components
3. **Continue systematic replacement** of hardcoded colors
4. **Implement linting rules** to prevent regression
5. **Document final color system** for team reference

## Enforcement

This specification is **MANDATORY** for all future development. Any new components or modifications to existing components must:
1. **Use only CSS variables** for colors
2. **Follow the established color mapping**
3. **Use standardized hover effects**
4. **Pass linting validation** for color usage

**No exceptions** will be made for hardcoded colors in new or modified code.
