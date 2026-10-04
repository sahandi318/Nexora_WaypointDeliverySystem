import {
  StoreManagerIssueError,
  createStoreManagerIssue,
  listStoreManagerIssues,
  resolveStoreManagerIssue,
} from "../services/storeManagerIssueService.js";

export async function getStoreManagerIssues(req, res) {
  try {
    const data = await listStoreManagerIssues(
      req.storeManagerContext,
      {
        status: req.query?.status ?? "ALL",
      }
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleIssueError(
      res,
      error,
      "Unable to load Store Manager issues."
    );
  }
}

export async function postStoreManagerIssue(req, res) {
  try {
    const issue = await createStoreManagerIssue(
      req.storeManagerContext,
      {
        orderCode: req.body?.orderCode,
        category: req.body?.category,
        description: req.body?.description,
      }
    );

    return res.status(201).json({
      success: true,
      data: { issue },
    });
  } catch (error) {
    return handleIssueError(
      res,
      error,
      "Unable to report this issue."
    );
  }
}

export async function postResolveStoreManagerIssue(req, res) {
  try {
    const result = await resolveStoreManagerIssue(
      req.storeManagerContext,
      req.params.issueCode,
      {
        resolutionNote: req.body?.resolutionNote ?? "",
      }
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleIssueError(
      res,
      error,
      "Unable to resolve this issue."
    );
  }
}

function handleIssueError(res, error, fallbackMessage) {
  if (error instanceof StoreManagerIssueError) {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  console.error(
    "Store Manager issue request failed:",
    error?.message || error
  );

  return res.status(500).json({
    success: false,
    code: "STORE_MANAGER_ISSUE_INTERNAL_ERROR",
    message: fallbackMessage,
  });
}
