import AdminShell from "../../components/admin/AdminShell";
import StaffRegistrationForm from "../../components/admin/StaffRegistrationForm";


function StoreManagerRegisterPage() {
  return (
    <AdminShell
      title="Register Store Manager"
      description="Create a Store Manager account and assign it to the correct Waypoint outlet."
    >
      <StaffRegistrationForm
        role="STORE_MANAGER"
        roleLabel="Store Manager"
        endpoint="/admin/staff/store-managers"
        assignmentType="outlet"
      />
    </AdminShell>
  );
}


export default StoreManagerRegisterPage;
