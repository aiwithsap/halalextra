# Admin Dashboard Implementation Roadmap
**Date**: September 30, 2025
**Status**: Phase 1 Complete ✅

---

## Overview

This document outlines the complete implementation plan for fixing all missing and non-functional features in the HalalExtra admin dashboard.

---

## ✅ Phase 1: Critical Fixes (COMPLETED - Week 1)

**Status**: Deployed to production on September 30, 2025

### 1.1 Inspector Assignment Issues ✅
- **Backend**: GET /api/admin/inspectors endpoint
- **Frontend**: Fixed ApplicationDetail.tsx dropdown to use new endpoint
- **Impact**: Inspector dropdown now populates correctly

### 1.2 Certificate Management Tab ✅
- **Backend**:
  - GET /api/admin/certificates (pagination, filtering, search)
  - PATCH /api/admin/certificates/:id/revoke (with audit logging)
- **Frontend**:
  - Complete CertificateList component
  - Search by certificate number/store name
  - Filter by status (active/expired/revoked)
  - Revoke dialog with reason input
  - Pagination support
- **Impact**: Certificate Management tab fully functional

### 1.3 Testing & Validation ✅
- Playwright E2E tests created
- Regression testing completed
- No impact to certificate generation functionality

---

## 🚧 Phase 2: User Management (Week 2) - PENDING

**Estimated Time**: 5 days
**Priority**: High

### 2.1 Backend Endpoints

#### GET /api/admin/users
```typescript
// List all users with pagination and filtering
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- role: 'admin' | 'inspector' | 'store_owner' (optional filter)
- search: string (search by username or email)

Response: {
  users: Array<{
    id: number,
    username: string,
    email: string,
    role: string,
    createdAt: date,
    lastLogin: date,
    isActive: boolean
  }>,
  page: number,
  limit: number,
  total: number
}
```

#### POST /api/admin/users
```typescript
// Create a new user
Body: {
  username: string,
  email: string,
  password: string,
  role: 'admin' | 'inspector' | 'store_owner'
}

Response: {
  user: UserObject,
  message: string
}
```

#### PATCH /api/admin/users/:id
```typescript
// Update user details
Body: {
  username?: string,
  email?: string,
  role?: string,
  isActive?: boolean
}

Response: {
  user: UserObject,
  message: string
}
```

#### PATCH /api/admin/users/:id/password
```typescript
// Reset user password
Body: {
  newPassword: string
}

Response: {
  message: string
}
```

#### DELETE /api/admin/users/:id
```typescript
// Deactivate user (soft delete)
Response: {
  message: string
}
```

### 2.2 Frontend Components

#### UserList Component
**File**: `client/src/components/dashboard/UserList.tsx`

**Features**:
- Table with user information (username, email, role, last login, status)
- Search by username or email
- Filter by role (admin, inspector, store_owner)
- Pagination (20 users per page)
- Actions: Edit, Reset Password, Deactivate/Activate
- Create New User button

#### CreateUserDialog Component
**File**: `client/src/components/dashboard/CreateUserDialog.tsx`

**Features**:
- Modal form for creating new users
- Fields: Username, Email, Password, Role
- Validation (password strength, email format, unique username)
- Role selection dropdown
- Success/error messages

#### EditUserDialog Component
**File**: `client/src/components/dashboard/EditUserDialog.tsx`

**Features**:
- Modal form for editing user details
- Fields: Username, Email, Role, Active Status
- Cannot edit own admin role (safety check)
- Confirmation for role changes

#### ResetPasswordDialog Component
**File**: `client/src/components/dashboard/ResetPasswordDialog.tsx`

**Features**:
- Modal form for password reset
- New password with strength indicator
- Confirm password field
- Option to email password to user

### 2.3 Dashboard Integration
**File**: `client/src/pages/admin/Dashboard.tsx`

Replace "Coming Soon" in Users tab with UserList component

### 2.4 Security Considerations
- Admins cannot delete themselves
- Admins cannot change their own role to non-admin
- Password reset requires confirmation
- Audit logging for all user management actions

### 2.5 Testing
- Playwright E2E tests for user CRUD operations
- Permission tests (only admin can access)
- Edge case tests (delete self, change own role, etc.)

---

## 🚧 Phase 3: Enhanced Search & Filtering (Week 3) - PENDING

**Estimated Time**: 3 days
**Priority**: Medium

### 3.1 Application Search Improvements

#### Advanced Search Component
**File**: `client/src/components/dashboard/AdvancedSearch.tsx`

**Features**:
- Multi-field search (store name, ABN, owner name, location)
- Date range filters (submission date, approval date)
- Status multi-select (pending, approved, rejected)
- Business type filter (restaurant, grocery, etc.)
- Clear filters button
- Save search presets

### 3.2 Backend Enhancements

#### PATCH /api/admin/applications/search
```typescript
// Advanced search with multiple criteria
Body: {
  storeName?: string,
  abn?: string,
  ownerName?: string,
  city?: string,
  state?: string,
  status?: string[],
  businessType?: string[],
  submissionDateFrom?: date,
  submissionDateTo?: date,
  approvalDateFrom?: date,
  approvalDateTo?: date
}

Response: {
  applications: Array<Application>,
  total: number
}
```

### 3.3 Export Functionality

#### Export Button Component
**Features**:
- Export to CSV
- Export to Excel (XLSX)
- Export filtered results only
- Include/exclude specific columns
- Email export to admin

#### GET /api/admin/applications/export
```typescript
// Export applications to CSV/Excel
Query Parameters:
- format: 'csv' | 'xlsx'
- filters: JSON string (same as search)

Response: File download
```

### 3.4 Saved Filters
- Save frequently used search filters
- Quick access to saved filters
- Share filters with other admins

---

## 🚧 Phase 4: Session Management Improvements (Week 3) - PENDING

**Estimated Time**: 2 days
**Priority**: Medium-High

### 4.1 Issues to Address
1. Sessions expire too quickly during admin work
2. No session timeout warning
3. No automatic session refresh

### 4.2 Backend Changes

#### Adjust Token Expiry
**File**: `server/auth.ts`

Current: 24 hours
Proposed:
- Access Token: 8 hours (increased from current)
- Refresh Token: 30 days
- Sliding window: Extend on activity

#### Implement Refresh Token Endpoint
```typescript
POST /api/auth/refresh
Body: {
  refreshToken: string
}

Response: {
  accessToken: string,
  refreshToken: string
}
```

### 4.3 Frontend Changes

#### Session Monitor Hook
**File**: `client/src/hooks/useSessionMonitor.ts`

**Features**:
- Track user activity
- Warn user 5 minutes before expiry
- Auto-refresh token on activity
- Redirect to login on expiry

#### Session Warning Dialog
**Component**: Shows countdown and "Extend Session" button

### 4.4 Testing
- Test session expiry scenarios
- Test token refresh
- Test warning dialog behavior

---

## 🚧 Phase 5: Additional Enhancements (Week 4+) - OPTIONAL

**Estimated Time**: Variable
**Priority**: Low

### 5.1 Dashboard Analytics
- Certificate status breakdown chart
- Monthly application trends
- Inspector workload distribution
- Average approval time metrics

### 5.2 Bulk Operations
- Bulk approve/reject applications
- Bulk assign inspectors
- Bulk export certificates

### 5.3 Email Notifications
- Certificate expiry reminders (30 days, 7 days)
- New application notifications
- Inspector assignment notifications

### 5.4 Activity Log Viewer
- View all admin actions
- Filter by user, action type, date range
- Export audit logs

### 5.5 Certificate Templates
- Customizable certificate designs
- Multiple template options
- Logo upload
- Color scheme customization

### 5.6 Mobile Responsive Improvements
- Optimize admin dashboard for tablets
- Mobile-friendly tables (collapsible)
- Touch-friendly controls

---

## Implementation Priority Matrix

### Critical (Must Have - Blocks Core Functionality)
- ✅ Phase 1: Inspector Assignment & Certificate Management

### High Priority (Needed for Complete Admin Experience)
- 🚧 Phase 2: User Management
- 🚧 Phase 4: Session Management

### Medium Priority (Improves Efficiency)
- 🚧 Phase 3: Advanced Search & Export

### Low Priority (Nice to Have)
- 🚧 Phase 5: Analytics, Bulk Operations, Templates

---

## Effort Estimation

| Phase | Backend | Frontend | Testing | Total Days |
|-------|---------|----------|---------|------------|
| ✅ Phase 1 | 1 day | 1 day | 0.5 days | 2.5 days |
| Phase 2 | 1.5 days | 2 days | 1 day | 4.5 days |
| Phase 3 | 1 day | 1.5 days | 0.5 days | 3 days |
| Phase 4 | 1 day | 0.5 days | 0.5 days | 2 days |
| Phase 5 | Variable | Variable | Variable | 5-10 days |

**Total Estimated Time**: 12-17 days for Phases 1-4, 17-27 days including Phase 5

---

## Testing Strategy

### Unit Tests
- Backend: Test all new API endpoints
- Frontend: Test components in isolation

### Integration Tests
- Test complete workflows (create user → assign to application)
- Test search/filter combinations

### E2E Tests (Playwright)
- Test complete admin workflows
- Test edge cases and error scenarios
- Test permissions and access control

### Regression Tests
- Ensure existing functionality (certificate generation, application flow) remains intact
- Run full test suite before each phase deployment

---

## Risk Assessment

### Phase 2 Risks
- **High**: User management is critical - errors could lock out admins
- **Mitigation**: Cannot delete/modify self, extensive testing, backup admin account

### Phase 3 Risks
- **Low**: Search enhancements are additive, won't break existing features
- **Mitigation**: Keep existing search functional as fallback

### Phase 4 Risks
- **Medium**: Session changes could cause authentication issues
- **Mitigation**: Implement graceful fallback, test thoroughly

### Phase 5 Risks
- **Low**: Optional enhancements, can be added incrementally
- **Mitigation**: Feature flags for gradual rollout

---

## Success Metrics

### Phase 1 (Complete)
- ✅ Inspector dropdown functional
- ✅ Certificate tab shows all certificates
- ✅ No regression in certificate generation

### Phase 2
- [ ] Admins can create/edit/deactivate users
- [ ] User table shows all system users
- [ ] Role changes are tracked in audit log

### Phase 3
- [ ] Advanced search reduces time to find applications by 50%
- [ ] Export functionality used by admins
- [ ] Saved filters improve workflow efficiency

### Phase 4
- [ ] Session timeout complaints reduced to zero
- [ ] Admin productivity increases (less re-login)
- [ ] No unexpected logouts during active work

### Phase 5
- [ ] Dashboard provides actionable insights
- [ ] Bulk operations reduce admin time by 30%
- [ ] Notifications reduce missed expirations

---

## Deployment Strategy

### Phase-by-Phase Deployment
- Deploy each phase independently
- Validate in production before starting next phase
- Roll back capability for each phase

### Feature Flags (Phase 5)
- Use feature flags for optional enhancements
- Enable for admin testing first
- Gradual rollout to all admins

### Monitoring
- Track API endpoint usage
- Monitor error rates
- Collect admin feedback

---

## Next Steps

### Immediate (This Week)
1. ✅ Complete Phase 1 deployment
2. ✅ Document Phase 1 implementation
3. Get stakeholder approval for Phase 2

### Short Term (Next 2 Weeks)
1. Implement Phase 2 (User Management)
2. Implement Phase 4 (Session Management)

### Medium Term (Weeks 3-4)
1. Implement Phase 3 (Search & Export)
2. Gather feedback on Phase 2 & 4

### Long Term (Month 2+)
1. Implement Phase 5 enhancements as needed
2. Continuous improvement based on admin feedback

---

**Document Created**: September 30, 2025
**Last Updated**: September 30, 2025
**Status**: Phase 1 Complete, Phase 2-5 Pending Approval