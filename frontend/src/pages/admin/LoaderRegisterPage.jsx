import AdminShell from "../../components/admin/AdminShell";
import StaffRegistrationForm from "../../components/admin/StaffRegistrationForm";


function LoaderRegisterPage() {
  return (
    <AdminShell
      title="Register Loader"
      description="Create a Loader account and assign it to the depot where loading operations are performed."
    >
      <StaffRegistrationForm
        role="LOADER"
        roleLabel="Loader"
        endpoint="/admin/staff/loaders"
        assignmentType="depot"
      />
    </AdminShell>
  );
}


export default LoaderRegisterPage;
