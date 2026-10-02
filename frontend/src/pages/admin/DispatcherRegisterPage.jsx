import AdminShell from "../../components/admin/AdminShell";
import StaffRegistrationForm from "../../components/admin/StaffRegistrationForm";


function DispatcherRegisterPage() {
  return (
    <AdminShell
      title="Register Dispatcher"
      description="Create a Dispatcher account and assign it to the depot responsible for its delivery planning work."
    >
      <StaffRegistrationForm
        role="DISPATCHER"
        roleLabel="Dispatcher"
        endpoint="/admin/staff/dispatchers"
        assignmentType="depot"
      />
    </AdminShell>
  );
}


export default DispatcherRegisterPage;
