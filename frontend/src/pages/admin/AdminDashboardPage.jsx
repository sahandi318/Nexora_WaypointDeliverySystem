import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  KeyRound,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import AdminShell from "../../components/admin/AdminShell";
import api from "../../services/api";


const INITIAL_FILTERS = {
  role:
    "ALL",

  status:
    "ALL",

  assignment:
    "ALL",

  passwordStatus:
    "ALL",
};


function AdminDashboardPage() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filters,
    setFilters,
  ] = useState(
    INITIAL_FILTERS
  );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    accounts,
    setAccounts,
  ] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  const [
    summary,
    setSummary,
  ] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
  });

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);


  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        async () => {
          try {
            setIsLoading(true);
            setErrorMessage("");

            const params =
              new URLSearchParams({
                search:
                  search.trim(),

                role:
                  filters.role,

                status:
                  filters.status,

                assignment:
                  filters.assignment,

                passwordStatus:
                  filters.passwordStatus,

                page:
                  String(page),

                limit:
                  "12",
              });

            const response =
              await api.get(
                `/admin/accounts?${params.toString()}`
              );


            setAccounts(
              response.data.accounts ||
              []
            );

            setPagination(
              response.data.pagination ||
              {
                page: 1,
                limit: 12,
                total: 0,
                totalPages: 1,
              }
            );

            setSummary(
              response.data.summary ||
              {
                total: 0,
                active: 0,
                inactive: 0,
                admins: 0,
              }
            );
          } catch (error) {
            setErrorMessage(
              error.response?.data
                ?.message ||
              "Unable to load the account directory."
            );
          } finally {
            setIsLoading(false);
          }
        },
        250
      );


    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    search,
    filters,
    page,
    refreshKey,
  ]);


  function updateFilter(
    name,
    value
  ) {
    setFilters(
      (current) => ({
        ...current,
        [name]:
          value,
      })
    );

    setPage(1);
  }


  function resetFilters() {
    setSearch("");
    setFilters(
      INITIAL_FILTERS
    );
    setPage(1);
  }


  return (
    <AdminShell
      title="Account directory"
      description="Search, review and filter all administrator and operational staff accounts from one secure workspace."
    >
      <SummaryGrid
        summary={summary}
      />


      <div
        className="
          mt-7
          grid
          gap-5
          lg:grid-cols-[260px_minmax(0,1fr)]
        "
      >
        <FilterPanel
          filters={filters}
          onChange={updateFilter}
          onReset={resetFilters}
        />


        <section className="min-w-0">
          <div
            className="
              mb-4
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                relative
                w-full
                sm:max-w-xl
              "
            >
              <Search
                size={18}
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-[var(--color-text-muted)]
                "
              />

              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );
                  setPage(1);
                }}
                placeholder="Search by User ID, name, email or phone"
                className="
                  nexora-focus
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-[var(--color-border)]
                  bg-[var(--color-surface)]
                  pl-11
                  pr-4
                  text-sm
                  text-[var(--color-text)]
                  shadow-[var(--shadow-xs)]
                  outline-none
                  transition
                  placeholder:text-[var(--color-text-muted)]
                  hover:border-[var(--color-border-strong)]
                  focus:border-[var(--color-primary)]
                "
              />
            </div>


            <button
              type="button"
              onClick={() =>
                setRefreshKey(
                  (current) =>
                    current + 1
                )
              }
              className="
                nexora-focus
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface)]
                px-4
                text-sm
                font-bold
                text-[var(--color-text-secondary)]
                transition
                hover:bg-[var(--color-surface-soft)]
                hover:text-[var(--color-text)]
              "
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>


          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              shadow-[var(--shadow-sm)]
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
                border-b
                border-[var(--color-border)]
                px-5
                py-4
              "
            >
              <div>
                <h2 className="font-bold">
                  Existing accounts
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    text-[var(--color-text-muted)]
                  "
                >
                  {pagination.total}{" "}
                  matching account
                  {pagination.total === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div
                className="
                  rounded-full
                  bg-[var(--color-primary-soft)]
                  px-3
                  py-1.5
                  text-xs
                  font-bold
                  text-[var(--color-primary)]
                "
              >
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </div>
            </div>


            {errorMessage ? (
              <div
                className="
                  m-5
                  rounded-xl
                  border
                  border-[var(--color-danger)]
                  bg-[var(--color-danger-soft)]
                  px-4
                  py-3
                  text-sm
                  text-[var(--color-danger)]
                "
              >
                {errorMessage}
              </div>
            ) : isLoading ? (
              <LoadingState />
            ) : accounts.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <DesktopAccountTable
                  accounts={accounts}
                />

                <MobileAccountCards
                  accounts={accounts}
                />
              </>
            )}


            <Pagination
              pagination={pagination}
              onPrevious={() =>
                setPage(
                  (current) =>
                    Math.max(
                      current - 1,
                      1
                    )
                )
              }
              onNext={() =>
                setPage(
                  (current) =>
                    Math.min(
                      current + 1,
                      pagination.totalPages
                    )
                )
              }
            />
          </div>
        </section>
      </div>
    </AdminShell>
  );
}


function SummaryGrid({
  summary,
}) {
  const cards = [
    {
      label:
        "Total accounts",
      value:
        summary.total,
      icon:
        Users,
    },
    {
      label:
        "Active",
      value:
        summary.active,
      icon:
        UserCheck,
    },
    {
      label:
        "Inactive",
      value:
        summary.inactive,
      icon:
        UserX,
    },
    {
      label:
        "Administrators",
      value:
        summary.admins,
      icon:
        ShieldCheck,
    },
  ];


  return (
    <div
      className="
        grid
        grid-cols-2
        gap-3
        lg:grid-cols-4
      "
    >
      {cards.map((card) => {
        const Icon =
          card.icon;

        return (
          <div
            key={card.label}
            className="
              rounded-2xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              p-4
              shadow-[var(--shadow-xs)]
              sm:p-5
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-semibold
                    text-[var(--color-text-muted)]
                  "
                >
                  {card.label}
                </p>

                <p
                  className="
                    mt-2
                    text-2xl
                    font-bold
                  "
                >
                  {card.value}
                </p>
              </div>

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[var(--color-primary-soft)]
                  text-[var(--color-primary)]
                "
              >
                <Icon size={19} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function FilterPanel({
  filters,
  onChange,
  onReset,
}) {
  return (
    <aside
      className="
        h-fit
        rounded-2xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        p-5
        shadow-[var(--shadow-sm)]
        lg:sticky
        lg:top-24
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
            font-bold
          "
        >
          <Filter size={17} />
          Filters
        </div>

        <button
          type="button"
          onClick={onReset}
          className="
            nexora-focus
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            px-2
            py-1.5
            text-xs
            font-bold
            text-[var(--color-primary)]
            transition
            hover:bg-[var(--color-surface-soft)]
          "
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>


      <div className="mt-5 space-y-4">
        <FilterSelect
          label="Role"
          value={filters.role}
          onChange={(value) =>
            onChange(
              "role",
              value
            )
          }
          options={[
            ["ALL", "All roles"],
            ["ADMIN", "Administrator"],
            ["STORE_MANAGER", "Store Manager"],
            ["DISPATCHER", "Dispatcher"],
            ["LOADER", "Loader"],
            ["DRIVER", "Driver"],
          ]}
        />

        <FilterSelect
          label="Account status"
          value={filters.status}
          onChange={(value) =>
            onChange(
              "status",
              value
            )
          }
          options={[
            ["ALL", "All statuses"],
            ["ACTIVE", "Active"],
            ["INACTIVE", "Inactive"],
          ]}
        />

        <FilterSelect
          label="Assignment"
          value={filters.assignment}
          onChange={(value) =>
            onChange(
              "assignment",
              value
            )
          }
          options={[
            ["ALL", "All assignments"],
            ["OUTLET", "Outlet assigned"],
            ["DEPOT", "Depot assigned"],
            ["UNASSIGNED", "Unassigned"],
          ]}
        />

        <FilterSelect
          label="Password state"
          value={
            filters.passwordStatus
          }
          onChange={(value) =>
            onChange(
              "passwordStatus",
              value
            )
          }
          options={[
            ["ALL", "All password states"],
            ["READY", "Ready"],
            ["CHANGE_REQUIRED", "Change required"],
          ]}
        />
      </div>
    </aside>
  );
}


function FilterSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-xs
          font-bold
          text-[var(--color-text-secondary)]
        "
      >
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          nexora-focus
          h-11
          w-full
          rounded-xl
          border
          border-[var(--color-border)]
          bg-[var(--color-input)]
          px-3
          text-sm
          text-[var(--color-text)]
          outline-none
          transition
          hover:border-[var(--color-border-strong)]
          focus:border-[var(--color-primary)]
        "
      >
        {options.map(([
          optionValue,
          optionLabel,
        ]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}


function DesktopAccountTable({
  accounts,
}) {
  return (
    <div
      className="
        hidden
        overflow-x-auto
        md:block
      "
    >
      <table className="w-full min-w-[880px] text-left">
        <thead
          className="
            bg-[var(--color-surface-soft)]
            text-xs
            uppercase
            tracking-[0.08em]
            text-[var(--color-text-muted)]
          "
        >
          <tr>
            <th className="px-5 py-3 font-bold">
              Account
            </th>
            <th className="px-5 py-3 font-bold">
              Role
            </th>
            <th className="px-5 py-3 font-bold">
              Assignment
            </th>
            <th className="px-5 py-3 font-bold">
              Status
            </th>
            <th className="px-5 py-3 font-bold">
              Password
            </th>
          </tr>
        </thead>

        <tbody>
          {accounts.map((account) => (
            <tr
              key={account.id}
              className="
                border-t
                border-[var(--color-border)]
              "
            >
              <td className="px-5 py-4">
                <div className="font-bold">
                  {account.fullName}
                </div>

                <div
                  className="
                    mt-1
                    text-xs
                    text-[var(--color-text-muted)]
                  "
                >
                  {account.userId}
                  {account.email
                    ? ` · ${account.email}`
                    : ""}
                </div>
              </td>

              <td className="px-5 py-4">
                <RoleBadge
                  role={account.role}
                />
              </td>

              <td className="px-5 py-4">
                <AssignmentLabel
                  account={account}
                />
              </td>

              <td className="px-5 py-4">
                <StatusBadge
                  active={
                    account.isActive
                  }
                />
              </td>

              <td className="px-5 py-4">
                <PasswordBadge
                  required={
                    account.mustChangePassword
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function MobileAccountCards({
  accounts,
}) {
  return (
    <div className="divide-y divide-[var(--color-border)] md:hidden">
      {accounts.map((account) => (
        <article
          key={account.id}
          className="p-4"
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >
            <div className="min-w-0">
              <h3 className="truncate font-bold">
                {account.fullName}
              </h3>

              <p
                className="
                  mt-1
                  truncate
                  text-xs
                  text-[var(--color-text-muted)]
                "
              >
                {account.userId}
                {account.email
                  ? ` · ${account.email}`
                  : ""}
              </p>
            </div>

            <StatusBadge
              active={
                account.isActive
              }
            />
          </div>


          <div
            className="
              mt-4
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <RoleBadge
              role={account.role}
            />

            <PasswordBadge
              required={
                account.mustChangePassword
              }
            />
          </div>


          <div
            className="
              mt-4
              rounded-xl
              bg-[var(--color-surface-soft)]
              px-3
              py-2.5
            "
          >
            <AssignmentLabel
              account={account}
            />
          </div>
        </article>
      ))}
    </div>
  );
}


function RoleBadge({
  role,
}) {
  return (
    <span
      className="
        inline-flex
        rounded-full
        bg-[var(--color-info-soft)]
        px-2.5
        py-1
        text-xs
        font-bold
        text-[var(--color-info)]
      "
    >
      {role.replaceAll(
        "_",
        " "
      )}
    </span>
  );
}


function StatusBadge({
  active,
}) {
  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-2.5
        py-1
        text-xs
        font-bold
        ${
          active
            ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
            : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
        }
      `}
    >
      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}


function PasswordBadge({
  required,
}) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        px-2.5
        py-1
        text-xs
        font-bold
        ${
          required
            ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
            : "bg-[var(--color-success-soft)] text-[var(--color-success)]"
        }
      `}
    >
      <KeyRound size={12} />
      {required
        ? "Change required"
        : "Ready"}
    </span>
  );
}


function AssignmentLabel({
  account,
}) {
  if (account.outlet) {
    return (
      <div
        className="
          flex
          items-center
          gap-2
          text-sm
        "
      >
        <MapPin
          size={15}
          className="text-[var(--color-primary)]"
        />

        <span>
          {account.outlet.outletCode}
          <span className="text-[var(--color-text-muted)]">
            {" "}· {account.outlet.brand}
          </span>
        </span>
      </div>
    );
  }


  if (account.depot) {
    return (
      <div
        className="
          flex
          items-center
          gap-2
          text-sm
        "
      >
        <Building2
          size={15}
          className="text-[var(--color-primary)]"
        />

        <span>
          {account.depot.code}
          <span className="text-[var(--color-text-muted)]">
            {" "}· {account.depot.name}
          </span>
        </span>
      </div>
    );
  }


  return (
    <span
      className="
        text-sm
        text-[var(--color-text-muted)]
      "
    >
      No operational assignment
    </span>
  );
}


function Pagination({
  pagination,
  onPrevious,
  onNext,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-3
        border-t
        border-[var(--color-border)]
        px-4
        py-4
        sm:px-5
      "
    >
      <p
        className="
          text-xs
          text-[var(--color-text-muted)]
        "
      >
        {pagination.total} result
        {pagination.total === 1
          ? ""
          : "s"}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={
            pagination.page <= 1
          }
          className="
            nexora-focus
            inline-flex
            h-9
            items-center
            gap-1.5
            rounded-lg
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            px-3
            text-xs
            font-bold
            transition
            hover:bg-[var(--color-surface-soft)]
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          <ChevronLeft size={14} />
          Prev
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={
            pagination.page >=
            pagination.totalPages
          }
          className="
            nexora-focus
            inline-flex
            h-9
            items-center
            gap-1.5
            rounded-lg
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            px-3
            text-xs
            font-bold
            transition
            hover:bg-[var(--color-surface-soft)]
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}


function LoadingState() {
  return (
    <div
      className="
        flex
        min-h-64
        items-center
        justify-center
      "
    >
      <div className="text-center">
        <div
          className="
            mx-auto
            h-8
            w-8
            animate-spin
            rounded-full
            border-4
            border-[var(--color-primary-soft)]
            border-t-[var(--color-primary)]
          "
        />

        <p
          className="
            mt-3
            text-sm
            text-[var(--color-text-muted)]
          "
        >
          Loading accounts...
        </p>
      </div>
    </div>
  );
}


function EmptyState() {
  return (
    <div
      className="
        flex
        min-h-64
        items-center
        justify-center
        px-5
        text-center
      "
    >
      <div>
        <Users
          size={28}
          className="mx-auto text-[var(--color-text-muted)]"
        />

        <h3 className="mt-3 font-bold">
          No matching accounts
        </h3>

        <p
          className="
            mt-1
            text-sm
            text-[var(--color-text-muted)]
          "
        >
          Adjust the search or filters to see more results.
        </p>
      </div>
    </div>
  );
}


export default AdminDashboardPage;
