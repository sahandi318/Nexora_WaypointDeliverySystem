import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CloudOff,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Thermometer,
  Truck,
  UserRoundCheck,
  Warehouse,
  Wifi,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import waypointLogo from '../../assets/waypoint-logo.png';
import ThemeToggle from '../../components/common/ThemeToggle';
import useAuth from '../../hooks/useAuth';
import useConnectivity from '../../hooks/useConnectivity';

import {
  fetchLoaderDashboard,
  fetchLoaderTrip,
  fetchLoaderIssues,
  setLoadingItem,
  reportLoadingIssue,
  saveVerification,
  completeLoaderHandover,
} from '../../services/loaderApi';



const navItems = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['loading', 'Loading', PackageCheck],
  ['issues', 'Issues', AlertTriangle],
  ['handover', 'Handover', UserRoundCheck],
];

const statusStyles = {
  LOADING: 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]',
  ISSUE: 'bg-[var(--color-warning-soft)] text-amber-700',
  READY: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  WAITING: 'bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]',
};

function Pill({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]',
    green: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
    orange: 'bg-[var(--color-warning-soft)] text-amber-700',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.08em] ${tones[tone]}`}>{children}</span>;
}

function Card({ className = '', children }) {
  return <section className={`nexora-card ${className}`}>{children}</section>;
}

export default function LoaderWorkspacePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const connectivity = useConnectivity();
  const isOnline = typeof connectivity === 'boolean' ? connectivity : connectivity?.isOnline ?? true;

  const [view, setView] = useState('dashboard');
  const [depotKey, setDepotKey] = useState('peliyagoda');
  const [tripId, setTripId] = useState('PEL-042');
  const [filter, setFilter] = useState('all');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [planChanged, setPlanChanged] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issue, setIssue] = useState(null);
  const [issueResolved, setIssueResolved] = useState(false);
  const [issueDraft, setIssueDraft] = useState(null);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [verifyChecks,setVerifyChecks] = useState(new Set());
  const [handoverDone, setHandoverDone] = useState(false);
  const [backendDashboard, setBackendDashboard] = useState(null);
  const [backendTrip, setBackendTrip] = useState(null);
  const [backendIssues, setBackendIssues] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [apiError, setApiError] = useState("");

  const currentBackendIssue =
    backendIssues.find(
      (item) =>
        item.tripId ===
          tripId &&
        item.status ===
          "PENDING"
    ) ||
    backendIssues.find(
      (item) =>
        item.tripId ===
        tripId
    );

  const displayedIssue =
    currentBackendIssue
      ? {
          id:
            currentBackendIssue.itemId,

          backendIssueId:
            currentBackendIssue.id,

          name:
            currentBackendIssue.itemName,

          stopName:
            currentBackendIssue.stopName,

          qty:
            currentBackendIssue.expectedQty,

          usable:
            currentBackendIssue.usableQty,

          note:
            currentBackendIssue.note,

          reportedAt:
            currentBackendIssue.createdAt,
        }
      : issue;
  

  const backendIssueResolved =
    currentBackendIssue
      ? currentBackendIssue.status ===
        "RESOLVED"
      : issueResolved;

  const depot =
  backendDashboard
    ? {
        ...backendDashboard.depot,
        trips:
          backendDashboard.trips || [],
      }
    : {
        key: depotKey,
        label:
          depotKey === "kandy"
            ? "Kandy Hub"
            : "Peliyagoda DC",
        dock: "",
        notice: "",
        trips: [],
      };

  const dashboardTrip =
    depot?.trips?.find(
      (item) =>
        item.id === tripId
    ) ||
    depot?.trips?.[0];

  const stops = useMemo(() => {
  if (!backendTrip?.stops) {
    return [];
  }

  return backendTrip.stops.map(
    (stop) => ({
      ...stop,

      items:
        stop.items.map(
          (item) => ({
            ...item,

            qty:
              item.quantity,
          })
        ),
    })
  );
}, [backendTrip]);

  const trip =
  backendTrip
    ? {
        ...backendTrip,

        type:
          backendTrip.vehicleType,

        trip:
          backendTrip.tripNumber,

        capacity:
          backendTrip.capacityWeight,

        loaded:
          backendTrip.loadedWeight,
      }
    : dashboardTrip;

  const issueCount = displayedIssue && !backendIssueResolved ? 1 : 0;
  const titleMap = {
  dashboard: [
    'Loading dashboard',
    'SHIFT A · TODAY',
  ],

  loading: [
    'Ordered loading checklist',

    trip
      ? `${depot.label.toUpperCase()} · ${(trip.type || '').toUpperCase()}`
      : 'LOADING TRIP...',
  ],

  issues: [
    'Loading issues',
    'PRE-DEPARTURE EXCEPTIONS',
  ],

  verify: [
    'Final verification',
    'RELEASE GATE · PRE-DEPARTURE',
  ],

  handover: [
    'Driver handover',
    'FINAL STEP · VEHICLE RELEASE',
  ],
};

const [pageTitle, eyebrow] =
  titleMap[view] ||
  titleMap.dashboard;

  
  
  useEffect(() => {
  if (!backendTrip?.stops) {
    return;
  }

  const loadedItems =
    backendTrip.stops
      .flatMap(
        (stop) =>
          stop.items
      )
      .filter(
        (item) =>
          item.loaded
      )
      .map(
        (item) =>
          item.id
      );

  setCheckedItems(
    new Set(loadedItems)
  );
}, [backendTrip]);  

  useEffect(() => {
    if (
      !backendTrip?.verification
    ) {
      return;
    }

    const checks =
      new Set();

    if (
      backendTrip.verification
        .count
    ) {
      checks.add(
        "count"
      );
    }

    if (
      backendTrip.verification
        .secure
    ) {
      checks.add(
        "secure"
      );
    }

    if (
      backendTrip.verification
        .temperature
    ) {
      checks.add(
        "temperature"
      );
    }

    if (
      backendTrip.verification
        .docs
    ) {
      checks.add(
        "docs"
      );
    }

    setVerifyChecks(
      checks
    );
  }, [backendTrip]);



  useEffect(() => {
    if (!tripId) {
      return;
    }
    setBackendTrip(null);
    async function loadTrip() {
      try {
        setLoadingTrip(true);
        setApiError("");

        const response =
          await fetchLoaderTrip(
            tripId
          );

        setBackendTrip(
          response.data.data
        );
      } catch (error) {
        console.error(
          "Failed to load trip:",
          error
        );

        setBackendTrip(null);

        setApiError(
          error.response?.data?.message ||
            "Failed to load trip."
        );
      } finally {
        setLoadingTrip(false);
      }
    }

    loadTrip();
  }, [tripId]);

  async function handleHandover() {
  try {
    await completeLoaderHandover(
      tripId,
      {
        sealNumber:
          "WP-8041",

        handoverCode:
          "6142",
      }
    );

    setHandoverDone(
      true
    );

    await reloadTrip();
    await reloadDashboard();
  } catch (error) {
    console.error(
      "Handover failed:",
      error
    );

    alert(
      error.response?.data
        ?.message ||
        "Unable to complete handover."
    );
  }
}

  function go(
  nextView,
  nextTripId
) {
  if (nextTripId) {
    setTripId(
      nextTripId
    );
  }

  setView(nextView);

  if (
    nextView ===
    "issues"
  ) {
    reloadIssues();
  }

  setMobileMenu(false);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
  

  function selectDepot(next) {
    setDepotKey(next);
    setTripId(next === 'kandy' ? 'KDY-008' : 'PEL-042');
    setFilter('all');
    setView('dashboard');
  }
/*
  function toggleLoaded(id) {
    setCheckedItems((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
*/
  async function reloadTrip() {
    if (!tripId) return;

    const response =
      await fetchLoaderTrip(
        tripId
      );

    setBackendTrip(
      response.data.data
    );
  }

  async function toggleLoaded(id) {
    try {
      const currentlyLoaded =
        checkedItems.has(id);

      await setLoadingItem(
        tripId,
        id,
        !currentlyLoaded
      );

      await reloadTrip();

      await reloadDashboard();
    } catch (error) {
      console.error(
        "Failed to update loading item:",
        error
      );
    }
  }

  async function reloadDashboard() {
  try {
    setLoadingDashboard(true);
    setApiError("");

    const response =
      await fetchLoaderDashboard(
        depotKey
      );

    setBackendDashboard(
      response.data.data
    );
  } catch (error) {
    console.error(
      "Dashboard reload failed:",
      error
    );

    setApiError(
      error.response?.data?.message ||
        "Failed to load dashboard."
    );
  } finally {
    setLoadingDashboard(false);
  }
}
  useEffect(() => {
    reloadDashboard();
  }, [depotKey]);

  async function reloadIssues() {
    try {
      const response =
        await fetchLoaderIssues();

      setBackendIssues(
        response.data.data
      );
    } catch (error) {
      console.error(
        "Failed to load issues:",
        error
      );
    }
  }


  useEffect(() => {
    reloadIssues();
  }, []);

  function startIssue(item, stop) {
    setIssueDraft({ ...item, stopName: stop.name, usable: Math.max(0, item.qty - 3), reason: 'Stock unavailable at picking area', note: `Only ${Math.max(0, item.qty - 3)} usable units are available.` });
    setShowIssueModal(true);
  }

  /*
  function submitIssue() {
    setIssue({ ...issueDraft, reportedAt: 'Just now' });
    setCheckedItems((current) => {
      const next = new Set(current);
      next.delete(issueDraft.id);
      return next;
    });
    setIssueResolved(false);
    setShowIssueModal(false);
  }
*/

  async function submitIssue() {
    try {
      const response =
        await reportLoadingIssue(
          tripId,
          {
            itemId:
              issueDraft.id,

            issueType:
              "MISSING",

            expectedQty:
              issueDraft.qty,

            usableQty:
              issueDraft.usable,

            reason:
              issueDraft.reason,

            note:
              issueDraft.note,
          }
        );

      const backendIssue =
        response.data.data;

      setIssue({
        id:
          backendIssue.itemId,

        backendIssueId:
          backendIssue.id,

        name:
          backendIssue.itemName,

        stopName:
          backendIssue.stopName,

        qty:
          backendIssue.expectedQty,

        usable:
          backendIssue.usableQty,

        note:
          backendIssue.note,

        reportedAt:
          "Just now",
      });

      setCheckedItems(
        (current) => {
          const next =
            new Set(
              current
            );

          next.delete(
            issueDraft.id
          );

          return next;
        }
      );

      setIssueResolved(
        false
      );

      setShowIssueModal(
        false
      );
      await reloadIssues();
      await reloadTrip();
      await reloadDashboard();
    } catch (error) {
      console.error(
        "Unable to report loading issue:",
        error
      );
    }
  }

  async function toggleVerification(
  id
) {
  const next =
    new Set(
      verifyChecks
    );

  if (
    next.has(id)
  ) {
    next.delete(id);
  } else {
    next.add(id);
  }

  try {
    await saveVerification(
      tripId,
      {
        count:
          next.has(
            "count"
          ),

        secure:
          next.has(
            "secure"
          ),

        temperature:
          next.has(
            "temperature"
          ),

        docs:
          next.has(
            "docs"
          ),
      }
    );

    setVerifyChecks(
      next
    );

    await reloadTrip();
  } catch (error) {
    console.error(
      "Failed to update verification:",
      error
    );
  }
}

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }
  


  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <aside className={`fixed inset-y-0 left-0 z-50 w-[248px] bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)] transition-transform lg:translate-x-0 ${mobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-7 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <img src={waypointLogo} alt="Waypoint" className="h-10 w-10 rounded-xl bg-white/95 object-contain p-1" />
              <div><p className="text-sm font-black tracking-[0.12em]">WAYPOINT</p><p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--color-sidebar-muted)]">LOADFLOW</p></div>
            </div>
            <button onClick={() => setMobileMenu(false)} className="rounded-lg p-2 lg:hidden"><X size={19} /></button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map(([key, label, Icon]) => {
              const active = (key === 'loading' && ['loading', 'verify'].includes(view)) || key === view;
              return (
                <button key={key} onClick={() => go(key)} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${active ? 'bg-[var(--color-sidebar-active)] text-white shadow-sm' : 'text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white'}`}>
                  <Icon size={18} /><span className="flex-1">{label}</span>
                  {key === 'issues' && issueCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-amber-950">{issueCount}</span>}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3.5">
            <div className="mb-3 flex items-start gap-2.5 text-[11px] leading-5 text-[var(--color-sidebar-muted)]"><ShieldCheck size={17} className="mt-0.5 shrink-0" /><p>Loading progress and exceptions are recorded against the active shift.</p></div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-black">{(user?.name || 'Loader').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{user?.name || 'Loader User'}</p><p className="text-[10px] text-[var(--color-sidebar-muted)]">Loader · Shift A</p></div>
                <button onClick={handleLogout} title="Logout" className="rounded-lg p-2 text-[var(--color-sidebar-muted)] hover:bg-white/10 hover:text-white"><LogOut size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileMenu && <button aria-label="Close menu" className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileMenu(false)} />}

      <main className="min-h-screen w-full overflow-x-hidden lg:ml-[248px] lg:w-[calc(100%-248px)]">
        {loadingDashboard && (
  <div className="p-6 text-sm text-[var(--color-text-muted)]">
    Loading assigned trips...
  </div>
)}

{apiError && (
  <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:mx-6 lg:mx-8">
    {apiError}
  </div>
)}

{loadingTrip &&
  view !==
    "dashboard" && (
    <div className="p-6 text-sm text-[var(--color-text-muted)]">
      Loading trip...
    </div>
)}
        <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] backdrop-blur-xl">
          <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMobileMenu(true)} className="nexora-focus grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden"><Menu size={20} /></button>
              <div className="min-w-0"><p className="truncate text-[10px] font-extrabold tracking-[0.13em] text-[var(--color-text-muted)]">{eyebrow}</p><h1 className="truncate text-xl font-black tracking-[-0.02em] sm:text-2xl">{pageTitle}</h1></div>
            </div>
            <div className="flex items-center gap-2">
              <label className="hidden items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)] sm:flex">
                <Warehouse size={16} className="text-[var(--color-primary)]" />
                <select value={depotKey} onChange={(e) => selectDepot(e.target.value)} className="bg-transparent font-bold text-[var(--color-text)] outline-none">
                  <option value="peliyagoda">Peliyagoda DC</option><option value="kandy">Kandy Hub</option>
                </select>
              </label>
              <button onClick={() => setShowPlanModal(true)} className="nexora-focus relative grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"><Bell size={18} /><span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--color-warning)] px-1 text-[9px] font-black text-white">1</span></button>
              <div className={`hidden h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold md:flex ${isOnline ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{isOnline ? <Wifi size={15} /> : <CloudOff size={15} />}{isOnline ? 'Online' : 'Offline'}</div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {!isOnline && <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:mx-6 lg:mx-8"><CloudOff size={19} /><div><strong className="block">Working offline</strong><span className="text-xs">Loading updates will remain available on this device and can sync when the connection returns.</span></div></div>}

        <div className="p-4 sm:p-6 lg:p-8">

          {view === 'dashboard' && (
            <Dashboard
              depot={depot}
              depotKey={depotKey}
              filter={filter}
              setFilter={setFilter}
              go={go}
            />
          )}

          {view !== 'dashboard' &&
            !trip &&
            loadingTrip && (
              <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
                Loading trip information...
              </div>
            )}

          {view === 'loading' && trip && (
            <LoadingView
              depot={depot}
              trip={trip}
              stops={stops}
              checkedItems={checkedItems}
              toggleLoaded={toggleLoaded}
              startIssue={startIssue}
              issue={displayedIssue}
              issueResolved={backendIssueResolved}
              go={go}
              setShowPlanModal={setShowPlanModal}
              planChanged={planChanged}
            />
          )}

          {view === 'issues' && (
            <IssuesView
              issue={displayedIssue}
              issueResolved={backendIssueResolved}
              setIssueResolved={setIssueResolved}
              go={go}
            />
          )}

          {view === 'verify' && trip && (
            <VerifyView
              trip={trip}
              depot={depot}
              stops={stops}
              verifyChecks={verifyChecks}
              onToggleVerification={toggleVerification}
              go={go}
            />
          )}

          {view === 'handover' && trip && (
            <HandoverView
              trip={trip}
              depot={depot}
              stops={stops}
              go={go}
              handoverDone={handoverDone}
              setHandoverDone={setHandoverDone}
              onHandover={handleHandover}
            />
          )}

        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 shadow-[0_-8px_24px_rgba(15,71,52,0.08)] lg:hidden">
        {navItems.map(([key, label, Icon]) => <button key={key} onClick={() => go(key)} className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-bold ${(key === 'loading' && ['loading','verify'].includes(view)) || key === view ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}><Icon size={18}/>{label}</button>)}
      </div>

      {showIssueModal && <IssueModal draft={issueDraft} setDraft={setIssueDraft} onClose={() => setShowIssueModal(false)} onSubmit={submitIssue} />}
      {showPlanModal && <PlanChangeModal onClose={() => setShowPlanModal(false)} onApply={() => { setPlanChanged(true); setShowPlanModal(false);}} />}
    </div>
  );
}

function Dashboard({ depot, filter, setFilter, go }) {
  const counts = {
    total: depot.trips.length,
    progress: depot.trips.filter((t) => t.status === 'LOADING').length,
    action: depot.trips.filter((t) => t.status === 'ISSUE').length,
    ready: depot.trips.filter((t) => t.status === 'READY').length,
  };
  const visible = depot.trips.filter((trip) => filter === 'all' || (filter === 'action' ? trip.status === 'ISSUE' : trip.status === 'READY'));
  const summary = [
    ['Trips this shift', counts.total, Truck, 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'],
    ['In progress', counts.progress, RefreshCw, 'bg-[var(--color-info-soft)] text-[var(--color-info)]'],
    ['Needs action', counts.action, AlertTriangle, 'bg-[var(--color-warning-soft)] text-amber-600'],
    ['Ready to leave', counts.ready, CheckCircle2, 'bg-[var(--color-success-soft)] text-[var(--color-success)]'],
  ];
  return <div className="space-y-5 pb-20 lg:pb-0">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{summary.map(([label, value, Icon, iconClass]) => <Card key={label} className="flex items-center gap-3 p-4"><span className={`grid h-10 w-10 place-items-center rounded-xl ${iconClass}`}><Icon size={19}/></span><div><p className="text-xs font-semibold text-[var(--color-text-muted)]">{label}</p><strong className="text-2xl font-black">{value}</strong></div></Card>)}</div>
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] p-5 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-lg font-black">Assigned trips</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Load by departure priority. Open any trip to continue the warehouse workflow.</p></div>
        <div className="flex rounded-xl bg-[var(--color-surface-soft)] p-1 text-xs font-bold">{[['all','All'],['action','Action'],['ready','Ready']].map(([key,label]) => <button key={key} onClick={() => setFilter(key)} className={`rounded-lg px-3 py-2 ${filter === key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}>{label}</button>)}</div>
      </div>
      <div className="divide-y divide-[var(--color-border)]">{visible.map((trip) => <article key={trip.id} className="grid gap-4 p-5 transition hover:bg-[var(--color-surface-soft)] xl:grid-cols-[1.5fr_0.9fr_130px_180px] xl:items-center">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"><Truck size={22}/></span><div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyles[trip.status]}`}>{trip.status}</span>{trip.priority && <span className="text-[11px] font-bold text-[var(--color-primary)]">Next departure</span>}</div><h3 className="font-extrabold">{trip.vehicle} · Trip {trip.trip}</h3><p className="mt-1 text-xs text-[var(--color-text-muted)]">{depot.label} → {trip.route} · {trip.stops} stops</p></div></div>
        <div><div className="mb-2 flex justify-between text-xs text-[var(--color-text-muted)]"><span>Load progress</span><strong className="text-[var(--color-text)]">{trip.progress}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-soft)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${trip.progress}%` }} /></div><p className="mt-2 text-[11px] text-[var(--color-text-muted)]">{trip.loaded} / {trip.capacity}</p></div>
        <div><p className="text-[9px] font-black tracking-[0.1em] text-[var(--color-text-muted)]">DEPART BY</p><strong className="text-xl">{trip.depart}</strong><p className="text-[11px] text-[var(--color-text-muted)]">{trip.note}</p></div>
        <button onClick={() => go(trip.status === 'ISSUE' ? 'issues' : trip.status === 'READY' ? 'handover' : 'loading', trip.id)} className={`nexora-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold ${trip.priority ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]' : 'border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)]'}`}>{trip.status === 'ISSUE' ? 'Review issue' : trip.status === 'READY' ? 'View handover' : 'Open trip'}<ChevronRight size={16}/></button>
      </article>)}</div>
    </Card>
    <div className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4"><Warehouse size={20} className="shrink-0 text-[var(--color-primary)]"/><div><strong className="text-sm">{depot.notice}</strong><p className="mt-1 text-xs text-[var(--color-text-muted)]">Keep staged goods within the marked loading zone until their assigned vehicle is ready.</p></div></div>
  </div>;
}

function WorkflowHero({ trip, depot, step, stopCount }) {
  const steps = ['Review', 'Load', 'Verify', 'Handover'];
  return <Card className="overflow-hidden"><div className="grid gap-5 p-5 md:grid-cols-[1.4fr_repeat(3,auto)] md:items-center"><div><Pill tone={step === 3 ? 'green' : 'default'}>{step === 3 ? 'READY' : 'ACTIVE TRIP'}</Pill><h2 className="mt-2 text-xl font-black">{trip.vehicle} · Trip {trip.trip}</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">{depot.label} → {trip.route}</p></div>{[['Stops', stopCount],['Depart by', trip.depart],['Dock', depot.dock]].map(([label,value]) => <div key={label} className="border-t border-[var(--color-border)] pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0"><p className="text-[9px] font-black tracking-[0.1em] text-[var(--color-text-muted)]">{label.toUpperCase()}</p><strong className="mt-1 block text-sm">{value}</strong></div>)}</div><div className="grid grid-cols-4 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-3">{steps.map((label,index) => <div key={label} className="relative flex items-center justify-center gap-2 text-[10px] font-bold sm:text-xs"><span className={`z-10 grid h-7 w-7 place-items-center rounded-full ${index < step ? 'bg-[var(--color-success)] text-white' : index === step ? 'bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary-soft)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>{index < step ? <Check size={14}/> : index + 1}</span><span className="hidden sm:inline">{label}</span></div>)}</div></Card>;
}

function LoadingView({ depot, trip, stops, checkedItems, toggleLoaded, startIssue, issue, issueResolved, go, setShowPlanModal, planChanged }) {
  const allItems = stops.flatMap((stop) => stop.items);
  const done = allItems.filter((item) => checkedItems.has(item.id)).length;
  const percent = allItems.length ? Math.round((done / allItems.length) * 100) : 0;
  const blocked = issue && !issueResolved;
  return <div className="space-y-4 pb-20 lg:pb-0">
    <button onClick={() => go('dashboard')} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"><ArrowLeft size={16}/>Back to assigned trips</button>
    <WorkflowHero trip={trip} depot={depot} step={1} stopCount={stops.length}/>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black">Load in reverse stop order</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">The first delivery stays nearest the rear door.</p></div><Pill tone="green">{percent}% LOADED</Pill></div>
        {planChanged && <div className="m-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"><span><strong>Updated plan applied.</strong> Fresh Borella is now Stop 01 and Dock 05 is assigned.</span><button className="font-extrabold underline" onClick={() => setShowPlanModal(true)}>View change</button></div>}
        <div className="p-5"><div className="mb-2 flex justify-between text-[9px] font-black tracking-[0.08em] text-[var(--color-text-muted)]"><span>CAB · LOAD FIRST</span><span>REAR DOOR · UNLOAD FIRST</span></div><div className="flex min-h-24 flex-row-reverse gap-2 rounded-[24px_8px_8px_24px] border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-soft)] p-2">{stops.map((stop) => <div key={stop.number} className="flex min-w-0 flex-1 flex-col justify-end rounded-lg bg-[var(--color-primary-soft)] p-2 text-[var(--color-primary-strong)]"><strong className="text-[10px]">STOP {String(stop.number).padStart(2,'0')}</strong><span className="mt-1 truncate text-[9px]">{stop.zone}</span></div>)}</div><p className="mt-3 text-xs text-[var(--color-text-muted)]"><strong className="text-[var(--color-text)]">Sequence check:</strong> {stops[0]?.name} unloads first, so place it nearest the rear door.</p></div>
        <div className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">{stops.map((stop) => <section key={stop.number}><div className="flex items-center gap-3 bg-[var(--color-surface-soft)] px-5 py-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-sidebar)] text-[10px] font-black text-white">{String(stop.number).padStart(2,'0')}</span><div className="flex-1"><strong className="block text-sm">{stop.name}</strong><span className="text-[11px] text-[var(--color-text-muted)]">{stop.window} · {stop.zone}</span></div><span className="text-[11px] font-black text-[var(--color-success)]">{stop.items.filter((item) => checkedItems.has(item.id)).length}/{stop.items.length}</span></div><div className="divide-y divide-[var(--color-border)] px-5">{stop.items.map((item) => { const checked = checkedItems.has(item.id); const itemIssue = issue?.id === item.id && !issueResolved; return <div key={item.id} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 py-3 sm:grid-cols-[40px_1fr_auto_auto]"><button onClick={() => toggleLoaded(item.id)} className={`grid h-9 w-9 place-items-center rounded-lg border-2 ${itemIssue ? 'border-amber-400 bg-amber-50 text-amber-600' : checked ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white' : 'border-[var(--color-border-strong)] bg-[var(--color-surface)]'}`}>{itemIssue ? <AlertTriangle size={16}/> : checked ? <Check size={17}/> : null}</button><div><strong className="block text-sm">{item.name}</strong><span className="text-[11px] text-[var(--color-text-muted)]">{item.meta}</span></div><div className="text-right"><strong className="block text-sm">{item.qty} {item.unit}</strong><span className="text-[10px] text-[var(--color-text-muted)]">Expected</span></div><button onClick={() => startIssue(item, stop)} className="col-start-2 text-right text-[11px] font-extrabold text-amber-700 sm:col-start-auto">{itemIssue ? 'Issue sent' : issueResolved && issue?.id === item.id ? 'Resolved ✓' : 'Report issue'}</button></div>; })}</div></section>)}</div>
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[var(--color-text-muted)]"><strong className="block text-sm text-[var(--color-text)]">{done} of {allItems.length} items checked</strong>{blocked ? 'Resolve the open shortfall before final verification.' : 'Quantities can still be corrected before verification.'}</p><button disabled={blocked} onClick={() => go('verify')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50">Continue to verification<ArrowRight size={16}/></button></div>
      </Card>
      <aside className="space-y-4"><Card className="p-5"><h3 className="font-black">Trip instructions</h3><div className="mt-4 space-y-3 text-xs">{[['Vehicle',trip.vehicle],['Vehicle type',trip.type],['Load limit',trip.capacity],['Driver',depot.label.includes('Kandy') ? 'Ishara Silva' : 'Ruwan Fernando'],['Special handling',trip.type.includes('Refrigerated') ? 'Cold chain + fragile' : 'Keep dry']].map(([label,value]) => <div key={label} className="flex justify-between gap-4"><span className="text-[var(--color-text-muted)]">{label}</span><strong className="text-right">{value}</strong></div>)}</div></Card><Card className="border-sky-200 bg-sky-50 p-5 dark:bg-[var(--color-surface)]"><div className="flex items-center gap-2 text-sky-700"><Thermometer size={18}/><h3 className="font-black">Cold-chain check</h3></div><div className="mt-4 text-3xl font-black text-sky-700">3.6°C <span className="text-xs font-semibold">current</span></div><div className="my-3 h-2 rounded-full bg-gradient-to-r from-sky-300 via-emerald-400 to-amber-400"/><p className="text-[11px] text-sky-700">Safe range: 2°C–5°C · Checked at 03:58</p></Card><button onClick={() => setShowPlanModal(true)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-bold hover:bg-[var(--color-surface-soft)]">Show plan-change scenario</button></aside>
    </div>
  </div>;
}

function IssuesView({ issue, issueResolved, setIssueResolved, go }) {
  const expected = issue?.qty ?? 25; const usable = issue?.usable ?? 22; const resolved = issue ? issueResolved : true;
  return <div className="grid gap-4 pb-20 xl:grid-cols-[minmax(0,1fr)_260px] lg:pb-0"><Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-5 sm:flex-row sm:items-start sm:justify-between"><div><Pill tone={resolved ? 'green' : 'orange'}>{resolved ? 'DISPATCHER RESPONDED' : 'AWAITING DISPATCHER'}</Pill><h2 className="mt-2 text-lg font-black">{issue?.name || 'Fresh milk 1L'} shortfall</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">WP-RF-042 · Trip 1 · {issue?.stopName || 'Fresh Negombo 02'}</p></div><button onClick={() => go('loading')} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold hover:bg-[var(--color-surface-soft)]">View checklist</button></div><div className="grid gap-6 p-5 lg:grid-cols-2"><div><div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[var(--color-border)] text-center">{[['EXPECTED',expected],['USABLE',usable],['SHORT',expected-usable]].map(([label,value],index) => <div key={label} className={`p-4 ${index < 2 ? 'border-r border-[var(--color-border)]' : 'bg-[var(--color-warning-soft)]'}`}><span className="block text-[9px] font-black tracking-[0.08em] text-[var(--color-text-muted)]">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>)}</div><div className="mt-4 rounded-xl bg-[var(--color-surface-soft)] p-4 text-xs text-[var(--color-text-secondary)]"><strong className="text-[var(--color-text)]">Loader note:</strong> {issue?.note || 'Only 22 undamaged crates are available in the cold room.'}</div></div><div className="space-y-4">{[['Issue reported by loader',true],['Sent to dispatcher queue',true],['Loader confirms resolution',resolved]].map(([label,done],index) => <div key={label} className="flex gap-3"><span className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full ${done ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]' : 'bg-[var(--color-warning-soft)] text-amber-600'}`}>{done ? <Check size={14}/> : index + 1}</span><div><strong className="text-sm">{label}</strong><p className="text-[11px] text-[var(--color-text-muted)]">{index === 0 ? issue?.reportedAt || '03:47' : index === 1 ? 'Dispatcher notification recorded' : resolved ? 'Accepted and checklist updated' : 'Waiting for loader'}</p></div></div>)}</div></div><div className={`m-5 mt-0 rounded-xl border-l-4 p-4 ${resolved ? 'border-[var(--color-success)] bg-[var(--color-success-soft)]' : 'border-amber-500 bg-[var(--color-warning-soft)]'}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black">{resolved ? `Proceed with ${usable} units` : 'Decision pending'}</h3><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{resolved ? `Update the manifest and mark ${expected-usable} units as deferred stock.` : 'You can continue loading unaffected items. Final verification remains blocked.'}</p></div><button onClick={() => { if (!resolved) setIssueResolved(true); else go('loading'); }} className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">{resolved ? 'Accept resolution & update' : 'Simulate dispatcher response'}</button></div></div></Card><Card className="grid min-h-48 place-items-center p-6 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-warning-soft)] text-amber-600"><AlertTriangle size={24}/></span><strong className="mt-3 block text-3xl">{issue && !issueResolved ? 1 : 0}</strong><p className="text-xs text-[var(--color-text-muted)]">issues waiting for action</p></div></Card></div>;
}

function VerifyView({ trip, depot, stops, verifyChecks, onToggleVerification, go }) {
  const checks = [['count','All item counts match','Includes approved shortfall adjustments'],['secure','Load secured for travel','Straps, dividers and fragile-item protection checked'],['temperature','Cold-chain temperature verified','Vehicle reading between 2°C and 5°C'],['docs','Manifest and seal recorded','Digital manifest matches vehicle seal WP-8041']];
  const allDone = checks.every(([id]) => verifyChecks.has(id));
  return <div className="space-y-4 pb-20 lg:pb-0"><button onClick={() => go('loading')} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)]"><ArrowLeft size={16}/>Back to loading checklist</button><WorkflowHero trip={trip} depot={depot} step={2} stopCount={stops.length}/><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]"><Card className="overflow-hidden"><div className="border-b border-[var(--color-border)] p-5"><h2 className="text-lg font-black">Final release checks</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Confirm these checks with the vehicle physically in front of you.</p></div><div className="divide-y divide-[var(--color-border)] px-5">{checks.map(([id,title,detail]) => { const checked = verifyChecks.has(id); return <div key={id} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 py-4"><button onClick={() => onToggleVerification(id)} className={`grid h-9 w-9 place-items-center rounded-lg border-2 ${checked ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white' : 'border-[var(--color-border-strong)]'}`}>{checked && <Check size={17}/>}</button><div><strong className="text-sm">{title}</strong><p className="text-[11px] text-[var(--color-text-muted)]">{detail}</p></div><span className={`text-[11px] font-bold ${checked ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`}>{checked ? 'Checked' : 'Required'}</span></div>; })}</div></Card><Card className="bg-[var(--color-sidebar)] p-5 text-white"><ClipboardCheck size={26} className="text-[var(--color-accent-soft)]"/><h3 className="mt-4 text-lg font-black">Ready for driver?</h3><p className="mt-2 text-xs leading-5 text-[var(--color-sidebar-muted)]">Completing verification locks loading quantities and creates the handover record.</p><div className="my-5 flex items-end justify-between"><strong className="text-4xl">{verifyChecks.size}/4</strong><span className="pb-1 text-[11px] text-[var(--color-sidebar-muted)]">checks complete</span></div><button disabled={!allDone} onClick={() => go('handover')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-extrabold text-[#07382b] disabled:opacity-40">Continue to driver handover<ArrowRight size={16}/></button></Card></div></div>;
}

function HandoverView({ trip, depot, stops, go, handoverDone, setHandoverDone, onHandover }) {
  if (handoverDone) return <div className="mx-auto max-w-xl pb-20 pt-8 text-center lg:pb-0"><Card className="p-8"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]"><CheckCircle2 size={32}/></span><Pill tone="green">HANDOVER RECORDED</Pill><h2 className="mt-4 text-2xl font-black">Vehicle released to driver</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">{trip.vehicle} was handed over successfully. The dispatcher can now see the vehicle as ready to depart.</p><button onClick={() => { setHandoverDone(false); go('dashboard'); }} className="mt-6 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white">Return to dashboard</button></Card></div>;
  return <div className="space-y-4 pb-20 lg:pb-0"><button onClick={() => go('verify')} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)]"><ArrowLeft size={16}/>Back to final verification</button><WorkflowHero trip={trip} depot={depot} step={3} stopCount={stops.length}/><div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]"><Card className="overflow-hidden"><div className="border-b border-[var(--color-border)] p-5"><h2 className="text-lg font-black">Confirm with the driver</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Both people review the route and sealed load before departure.</p></div><div className="flex flex-wrap items-center gap-4 border-b border-[var(--color-border)] p-5"><span className="grid h-13 w-13 place-items-center rounded-full bg-[var(--color-primary-soft)] font-black text-[var(--color-primary-strong)]">RF</span><div className="flex-1"><h3 className="font-black">Ruwan Fernando</h3><p className="text-xs text-[var(--color-text-muted)]">Driver · WP-D-017 · Mobile ending 0842</p></div><div><p className="text-[9px] font-black tracking-[0.1em] text-[var(--color-text-muted)]">HANDOVER CODE</p><strong className="text-2xl tracking-[0.18em]">6142</strong></div></div><div className="divide-y divide-[var(--color-border)] px-5">{[`Driver confirmed vehicle ${trip.vehicle}`,`Route and ${stops.length} stop sequence reviewed`,'Seal WP-8041 intact and recorded','Driver received offline trip copy'].map((text) => <div key={text} className="flex items-center gap-3 py-3 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]"><Check size={14}/></span>{text}</div>)}</div><div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[var(--color-text-muted)]"><strong className="block text-sm text-[var(--color-text)]">Planned departure {trip.depart}</strong>The dispatcher will see the release immediately.</p><button onClick={onHandover} className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white">Confirm handover & release vehicle</button></div></Card><Card className="p-5"><h3 className="font-black">Route handed over</h3><div className="mt-4 space-y-0">{stops.map((stop,index) => <div key={stop.number} className="relative flex gap-3 pb-5 last:pb-0">{index < stops.length - 1 && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-[var(--color-border-strong)]"/>}<span className="z-10 grid h-7 w-7 place-items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[10px] font-black text-[var(--color-primary)]">{stop.number}</span><div><strong className="text-sm">{stop.name}</strong><p className="text-[11px] text-[var(--color-text-muted)]">{stop.window}</p></div></div>)}</div></Card></div></div>;
}

function IssueModal({ draft, setDraft, onClose, onSubmit }) {
  if (!draft) return null;
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"><div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"><div className="flex items-start justify-between p-5"><div><p className="text-[10px] font-black tracking-[0.12em] text-[var(--color-text-muted)]">PRE-DEPARTURE EXCEPTION</p><h2 className="mt-1 text-xl font-black">Report an item issue</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-surface-soft)]"><X size={18}/></button></div><div className="px-5 pb-5"><div className="flex gap-3 rounded-xl bg-[var(--color-surface-soft)] p-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]"><Box size={19}/></span><div><span className="text-[9px] font-black tracking-[0.1em] text-[var(--color-text-muted)]">ITEM</span><strong className="block text-sm">{draft.name}</strong><p className="text-[11px] text-[var(--color-text-muted)]">{draft.stopName}</p></div></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl border border-[var(--color-border)] p-3"><span className="text-[10px] font-bold text-[var(--color-text-muted)]">Expected</span><strong className="mt-1 block text-lg">{draft.qty} {draft.unit}</strong></div><label className="rounded-xl border border-[var(--color-border)] p-3"><span className="text-[10px] font-bold text-[var(--color-text-muted)]">Usable quantity</span><input type="number" min="0" max={draft.qty} value={draft.usable} onChange={(e) => setDraft({ ...draft, usable: Number(e.target.value) })} className="mt-1 w-full bg-transparent text-lg font-black outline-none"/></label></div><label className="mt-4 block text-xs font-bold">Reason<select value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] p-3 text-sm outline-none"><option>Stock unavailable at picking area</option><option>Packaging damaged</option><option>Temperature check failed</option><option>Wrong item staged</option></select></label><label className="mt-4 block text-xs font-bold">Note to dispatcher<textarea rows="3" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className="mt-2 w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] p-3 text-sm outline-none"/></label><p className="mt-3 rounded-xl bg-[var(--color-warning-soft)] p-3 text-[11px] text-amber-800">The trip cannot be released until the dispatcher resolves this issue.</p></div><div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4"><button onClick={onClose} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">Cancel</button><button onClick={onSubmit} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white">Send to dispatcher</button></div></div></div>;
}

function PlanChangeModal({ onClose, onApply }) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"><div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"><div className="bg-[var(--color-warning-soft)] px-5 py-2 text-[10px] font-black tracking-[0.08em] text-amber-700">PLAN UPDATED · 04:03</div><div className="flex items-start justify-between p-5"><div><p className="text-[10px] font-black tracking-[0.12em] text-[var(--color-text-muted)]">DISPATCHER NOTICE</p><h2 className="mt-1 text-xl font-black">Loading plan changed</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-surface-soft)]"><X size={18}/></button></div><div className="px-5 pb-5"><p className="text-sm leading-6 text-[var(--color-text-secondary)]">Dispatcher updated <strong>WP-RF-042 · Trip 1</strong> after a late chilled order was confirmed.</p><div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="rounded-xl border border-[var(--color-border)] p-3"><span className="text-[9px] font-black text-[var(--color-text-muted)]">BEFORE</span><strong className="mt-1 block text-sm">3 stops · 78 units</strong><p className="text-[11px] text-[var(--color-text-muted)]">Dock 03</p></div><ArrowRight size={18} className="text-[var(--color-primary)]"/><div className="rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary-soft)] p-3"><span className="text-[9px] font-black text-[var(--color-primary-strong)]">NOW</span><strong className="mt-1 block text-sm">4 stops · 86 units</strong><p className="text-[11px] text-[var(--color-primary-strong)]">Dock 05</p></div></div><div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><strong>Pause before continuing.</strong> Review the revised stop sequence so the first delivery remains nearest the rear door.</div></div><div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4"><button onClick={onClose} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">Remind me later</button><button onClick={onApply} className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">Review updated plan</button></div></div></div>;
}
