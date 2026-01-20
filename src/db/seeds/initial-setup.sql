-- 1 & 2. Insert Roles (Tenant and Platform)
INSERT INTO iam_roles (key, is_system)
VALUES
    ('tenant_owner', false),
    ('tenant_admin', false),
    ('tenant_member', false),
    ('tenant_guest', false),
    ('platform_admin', true),
    ('platform_superadmin', true),
    ('platform_support', true)
ON CONFLICT (key) DO NOTHING;

-- 3. Insert Permissions
INSERT INTO iam_permissions (key)
VALUES
    ('tenant.read'), ('tenant.update'), ('tenant.delete'),
    ('member.invite'), ('member.remove'),
    ('project.create'), ('project.update'), ('project.delete'),
    ('billing.view'), ('billing.manage'),
    ('platform.tenant.read'), ('platform.tenant.suspend'), ('platform.tenant.delete'),
    ('platform.billing.adjust'), ('platform.plan.manage'),
    ('platform.user.impersonate'), ('platform.security.view'), ('platform.system.configure')
ON CONFLICT (key) DO NOTHING;

-- 4 - 9. Assign Permissions to Specific Roles
-- Using a common pattern to map permission keys to a role key
INSERT INTO iam_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM iam_roles r
CROSS JOIN iam_permissions p
WHERE
    (r.key = 'tenant_owner' AND p.key IN ('tenant.read', 'tenant.update', 'member.invite', 'member.remove', 'project.create', 'project.update', 'project.delete', 'billing.view', 'billing.manage'))
    OR
    (r.key = 'tenant_admin' AND p.key IN ('tenant.read', 'member.invite', 'member.remove', 'project.create', 'project.update', 'billing.view'))
    OR
    (r.key = 'tenant_member' AND p.key IN ('tenant.read', 'project.create', 'project.update'))
    OR
    (r.key = 'tenant_guest' AND p.key IN ('tenant.read'))
    OR
    (r.key = 'platform_support' AND p.key IN ('platform.tenant.read', 'platform.user.impersonate', 'platform.security.view'))
    OR
    (r.key = 'platform_admin' AND p.key IN ('platform.tenant.read', 'platform.tenant.suspend', 'platform.billing.adjust', 'platform.plan.manage', 'platform.security.view'))
ON CONFLICT DO NOTHING;

-- 10. Assign ALL Permissions to platform_superadmin
INSERT INTO iam_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM iam_roles r
CROSS JOIN iam_permissions p
WHERE r.key = 'platform_superadmin'
ON CONFLICT DO NOTHING;

-- 11. Insert Default Tenant
INSERT INTO tenants (name)
VALUES ('Default Workspace')
ON CONFLICT DO NOTHING;

-- 12. Assign Tenant Owner (Assumes 'owner@example.com' exists)
INSERT INTO tenant_members (tenant_id, user_id, role_id)
SELECT
    (SELECT id FROM tenants WHERE name = 'Default Workspace' LIMIT 1),
    (SELECT id FROM users WHERE email = 'owner@example.com' LIMIT 1),
    (SELECT id FROM iam_roles WHERE key = 'tenant_owner' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'owner@example.com')
ON CONFLICT DO NOTHING;

-- 13. Assign Platform Superadmin (Assumes 'admin@example.com' exists)
INSERT INTO platform_role_assignments (assigned_user_id, role_id, assigned_by, reason)
SELECT
    u.id,
    (SELECT id FROM iam_roles WHERE key = 'platform_superadmin' LIMIT 1),
    u.id,
    'Initial platform bootstrap'
FROM users u
WHERE u.email = 'admin@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO billing_plans
  (name, key, base_price, currency, billing_interval, is_active, is_custom)
VALUES
  -- One-time access plan
  ('Starter', 'starter', 2900, 'USD', 'monthly', true, false),

  -- Plus subscription
  ('Plus', 'plus', 2000, 'USD', 'monthly', true, false),

  -- Business subscription
  ('Business', 'business', 5000, 'USD', 'monthly', true, false),

  -- Enterprise (custom pricing)
  ('Enterprise', 'enterprise', 0, 'USD', 'yearly', true, true);

INSERT INTO billing_plan_features
  (plan_id, feature_key, included_units, overage_price, workspace_count, guest_count, member_seat)
VALUES
  (1, 'projects', 5, NULL, 1, 5, 5),
  (1, 'ai_chat', 100, 20, 1, 5, 5),
  (1, 'export', 10, 50, 1, 5, 5);

INSERT INTO billing_plan_features
  (plan_id, feature_key, included_units, overage_price, workspace_count, guest_count, member_seat)
VALUES
  (2, 'projects', 10, NULL, 3, 20, 20),
  (2, 'ai_chat', 1000, 10, 3, 20, 20),
  (2, 'export', 100, 30, 3, 20, 20);

INSERT INTO billing_plan_features
  (plan_id, feature_key, included_units, overage_price, workspace_count, guest_count, member_seat)
VALUES
  (3, 'projects', 50, NULL, 10, 100, 100),
  (3, 'ai_chat', 5000, 5, 10, 100, 100),
  (3, 'export', 500, 15, 10, 100, 100);

INSERT INTO billing_plan_features
  (plan_id, feature_key, included_units, overage_price, workspace_count, guest_count, member_seat)
VALUES
  (4, 'projects', -1, NULL, -1, -1, -1),
  (4, 'ai_chat', -1, NULL, -1, -1, -1),
  (4, 'export', -1, NULL, -1, -1, -1);

--
-- // const DODO_PRODUCT_ID = {
-- //   ONE_TIME: "pdt_0NVeFLSqAjAArg5ISAnYC",
-- //   PLUS_PLAN_SUBSCRIPTION: "pdt_0NVgU2IAyiymNkNAL9rVd",
-- //   BUSINESS_PLAN_SUBSCRIPTION: "pdt_0NVgUDiQjnWtCgKeNovPZ",
-- // }
INSERT INTO billing_plan_prices
(plan_id, provider, provider_product_id, currency, billing_interval)
SELECT id, 'dodo', 'pdt_0NVeFLSqAjAArg5ISAnYC', 'USD', 'one_time'
FROM billing_plans WHERE key = 'one_time';

INSERT INTO billing_plan_prices
(plan_id, provider, provider_product_id, currency, billing_interval)
SELECT id, 'dodo', 'pdt_0NVgU2IAyiymNkNAL9rVd','USD', 'monthly'
FROM billing_plans WHERE key = 'plus';

INSERT INTO billing_plan_prices
(plan_id, provider, provider_product_id, currency, billing_interval)
SELECT id, 'dodo', 'pdt_0NVgUDiQjnWtCgKeNovPZ', 'USD', 'monthly'
FROM billing_plans WHERE key = 'business';

INSERT INTO billing_plan_prices
(plan_id, provider, provider_product_id, provider_price_id, currency, billing_interval)
SELECT id, 'dodo', 'dp_enterprise', 'dp_enterprise_custom', 'USD', 'monthly'
FROM billing_plans WHERE key = 'enterprise';
