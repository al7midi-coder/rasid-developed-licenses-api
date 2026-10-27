ALTER TABLE developed_licenses.coordination_user_roles DROP CONSTRAINT IF EXISTS coordination_user_roles_role_check;
ALTER TABLE developed_licenses.coordination_user_roles ADD CONSTRAINT coordination_user_roles_role_check CHECK (role IN ('coordination_admin','unblocking_coordinator','internal_reviewer','template_admin','read_only','clause_editor'));
