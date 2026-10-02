import AdminShell from "../../components/admin/AdminShell";
import StaffRegistrationForm from "../../components/admin/StaffRegistrationForm";


function DriverRegisterPage() {
  return (
    <AdminShell
      title="Register Driver"
      description="Create a Driver account and assign it to the depot responsible for its delivery operations."
    >
      <StaffRegistrationForm
        role="DRIVER"
        roleLabel="Driver"
        endpoint="/admin/staff/drivers"
        assignmentType="depot"
      />
    </AdminShell>
  );
}


export default DriverRegisterPage;
