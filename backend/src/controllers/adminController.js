import {
  deleteStaffAccount,
  getAccountDirectory,
  getActiveDepots,
  getActiveOutlets,
  getAdministratorProfile,
  registerAdministrator,
  registerStaffMember,
  updateAdministratorProfile,
  updateAdministratorProfilePhoto,
} from "../services/adminService.js";


const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USER_ID_PATTERN =
  /^[A-Za-z0-9_-]{3,50}$/;


const PROFILE_PHOTO_PATTERN =
  /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

const MAX_PROFILE_PHOTO_LENGTH =
  900_000;


// ============================================================
// PUBLIC ADMIN REGISTRATION
// ============================================================

export async function registerAdmin(
  req,
  res,
  next
) {
  try {
    const {
      userId,
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      adminSecretKey,
    } = req.body;


    if (
      typeof userId !==
        "string" ||
      !USER_ID_PATTERN.test(
        userId.trim()
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Administrator User ID must be 3-50 characters and use only letters, numbers, hyphens or underscores.",
        });
    }


    if (
      typeof fullName !==
        "string" ||
      fullName.trim().length < 2 ||
      fullName.trim().length > 150
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Enter a valid administrator full name.",
        });
    }


    if (
      typeof email !==
        "string" ||
      !EMAIL_PATTERN.test(
        email.trim()
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Enter a valid administrator email address.",
        });
    }


    if (
      phone !== undefined &&
      phone !== null &&
      (
        typeof phone !==
          "string" ||
        phone.trim().length > 30
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Enter a valid phone number.",
        });
    }


    if (
      typeof password !==
        "string" ||
      password.length === 0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Password is required.",
        });
    }


    if (
      password !==
      confirmPassword
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Password and confirmation do not match.",
        });
    }


    if (
      typeof adminSecretKey !==
        "string" ||
      adminSecretKey.length === 0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Administrator secret key is required.",
        });
    }


    const result =
      await registerAdministrator({
        userId,
        fullName,
        email,
        phone,
        password,
        adminSecretKey,
      });


    if (!result.success) {
      if (
        result.reason ===
        "INVALID_ADMIN_SECRET"
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "The administrator secret key is invalid.",
          });
      }


      if (
        result.reason ===
        "INVALID_USER_ID_FORMAT"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Administrator User IDs must start with ADMIN followed by numbers only.",
          });
      }


      if (
        result.reason ===
        "USER_ID_EXISTS"
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "That administrator User ID is already in use.",
          });
      }


      if (
        result.reason ===
        "EMAIL_EXISTS"
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "That email address is already registered.",
          });
      }


      if (
        result.reason ===
        "WEAK_PASSWORD"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              result.message,
          });
      }


      return res
        .status(400)
        .json({
          success: false,

          message:
            "Unable to register the administrator account.",
        });
    }


    return res
      .status(201)
      .json({
        success: true,

        message:
          "Administrator account registered successfully.",

        admin:
          result.admin,
      });
  } catch (error) {
    return next(error);
  }
}


// ============================================================
// ADMIN ACCESS CHECK
// ============================================================

export function getAdminAccessCheck(
  req,
  res
) {
  const user =
    req.user;


  return res
    .status(200)
    .json({
      success: true,

      message:
        "Administrator access verified.",

      user: {
        id:
          user.id,

        userId:
          user.userId,

        fullName:
          user.fullName,

        email:
          user.email,

        role:
          user.role,

        isActive:
          user.isActive,

        mustChangePassword:
          user.mustChangePassword,
      },
    });
}


// ============================================================
// ADMIN PROFILE
// ============================================================

export async function getAdminProfile(
  req,
  res,
  next
) {
  try {
    const profile =
      await getAdministratorProfile(
        req.user.id
      );


    if (!profile) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Administrator profile was not found.",
        });
    }


    return res
      .status(200)
      .json({
        success: true,

        profile,
      });
  } catch (error) {
    return next(error);
  }
}


// ============================================================
// UPDATE ADMIN PROFILE
// ============================================================

export async function updateAdminProfile(
  req,
  res,
  next
) {
  try {
    const {
      fullName,
      email,
      phone,
    } = req.body;


    if (
      typeof fullName !==
        "string" ||
      fullName.trim().length < 2 ||
      fullName.trim().length > 150
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Enter a valid administrator full name.",
        });
    }


    if (
      typeof email !==
        "string" ||
      !EMAIL_PATTERN.test(
        email.trim()
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Enter a valid administrator email address.",
        });
    }


    if (
      phone !== undefined &&
      phone !== null &&
      (
        typeof phone !==
          "string" ||
        phone.trim().length > 30
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Enter a valid phone number.",
        });
    }


    const result =
      await updateAdministratorProfile({
        userDatabaseId:
          req.user.id,

        fullName,
        email,
        phone,
      });


    if (!result.success) {
      if (
        result.reason ===
        "EMAIL_EXISTS"
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "That email address is already registered to another account.",
          });
      }


      if (
        result.reason ===
        "USER_NOT_FOUND"
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Administrator profile was not found.",
          });
      }


      return res
        .status(400)
        .json({
          success: false,

          message:
            "Unable to update the administrator profile.",
        });
    }


    return res
      .status(200)
      .json({
        success: true,

        message:
          "Administrator profile updated successfully.",

        profile:
          result.profile,
      });
  } catch (error) {
    return next(error);
  }
}


// ============================================================
// UPDATE ADMIN PROFILE PHOTO
// ============================================================

export async function updateAdminProfilePhoto(
  req,
  res,
  next
) {
  try {
    const {
      profilePhotoData,
    } = req.body;


    const wantsToRemovePhoto =
      profilePhotoData ===
      null;


    if (
      !wantsToRemovePhoto &&
      (
        typeof profilePhotoData !==
          "string" ||
        profilePhotoData.length ===
          0 ||
        profilePhotoData.length >
          MAX_PROFILE_PHOTO_LENGTH ||
        !PROFILE_PHOTO_PATTERN.test(
          profilePhotoData
        )
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Upload a valid JPG, PNG or WebP profile photo.",
        });
    }


    const result =
      await updateAdministratorProfilePhoto({
        userDatabaseId:
          req.user.id,

        profilePhotoData:
          wantsToRemovePhoto
            ? null
            : profilePhotoData,
      });


    if (!result.success) {
      if (
        result.reason ===
        "USER_NOT_FOUND"
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Administrator profile was not found.",
          });
      }


      return res
        .status(400)
        .json({
          success: false,

          message:
            "Unable to update the administrator profile photo.",
        });
    }


    return res
      .status(200)
      .json({
        success: true,

        message:
          "Administrator profile photo updated successfully.",

        profile:
          result.profile,
      });
  } catch (error) {
    return next(error);
  }
}


// ============================================================
// ACCOUNT DIRECTORY
// ============================================================

export async function getAdminAccounts(
  req,
  res,
  next
) {
  try {
    const result =
      await getAccountDirectory({
        search:
          req.query.search,

        role:
          req.query.role,

        status:
          req.query.status,

        assignment:
          req.query.assignment,

        passwordStatus:
          req.query.passwordStatus,

        page:
          req.query.page,

        limit:
          req.query.limit,
      });


    return res
      .status(200)
      .json({
        success: true,

        ...result,
      });
  } catch (error) {
    return next(error);
  }
}


// ============================================================
// REMOVE STAFF ACCOUNT
// ============================================================

export async function deleteAdminManagedAccount(
  req,
  res,
  next
) {
  try {
    const accountId =
      Number(
        req.params.accountId
      );


    if (
      !Number.isInteger(
        accountId
      ) ||
      accountId <= 0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Enter a valid account ID.",
        });
    }


    const result =
      await deleteStaffAccount({
        userDatabaseId:
          accountId,
      });


    if (!result.success) {
      if (
        result.reason ===
        "USER_NOT_FOUND"
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "That staff account was not found.",
          });
      }


      if (
        result.reason ===
        "ADMIN_PROTECTED"
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Administrator profiles are protected and cannot be removed from the account directory.",
          });
      }


      return res
        .status(400)
        .json({
          success: false,

          message:
            "Unable to remove the staff account.",
        });
    }


    return res
      .status(200)
      .json({
        success: true,

        message:
          `${result.deletedAccount.fullName} was removed successfully.`,

        deletedAccount: {
          id:
            result.deletedAccount.id,

          userId:
            result.deletedAccount.userId,

          fullName:
            result.deletedAccount.fullName,

          role:
            result.deletedAccount.role,
        },
      });
  } catch (error) {
    return next(error);
  }
}


// ============================================================
// STAFF REGISTRATION HELPERS
// ============================================================

function parseRequiredPositiveInteger(
  value
) {
  const numericValue =
    Number(value);


  return Number.isInteger(
    numericValue
  ) &&
  numericValue > 0
    ? numericValue
    : null;
}


function createStaffRegistrationHandler({
  role,
  roleLabel,
  assignmentType,
}) {
  return async function registerStaff(
    req,
    res,
    next
  ) {
    try {
      const {
        userId,
        fullName,
        email,
        phone,
        password,
        confirmPassword,
        outletId,
        depotId,
      } = req.body;


      if (
        typeof userId !==
          "string" ||
        !USER_ID_PATTERN.test(
          userId.trim()
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              `${roleLabel} User ID must be 3-50 characters and use only letters, numbers, hyphens or underscores.`,
          });
      }


      if (
        typeof fullName !==
          "string" ||
        fullName.trim().length < 2 ||
        fullName.trim().length > 150
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              `Enter a valid ${roleLabel.toLowerCase()} full name.`,
          });
      }


      if (
        typeof email !==
          "string" ||
        !EMAIL_PATTERN.test(
          email.trim()
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Enter a valid email address.",
          });
      }


      if (
        phone !== undefined &&
        phone !== null &&
        (
          typeof phone !==
            "string" ||
          phone.trim().length > 30
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Enter a valid phone number.",
          });
      }


      if (
        typeof password !==
          "string" ||
        password.length === 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Temporary password is required.",
          });
      }


      if (
        password !==
        confirmPassword
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Password and confirmation do not match.",
          });
      }


      const assignmentId =
        assignmentType ===
        "outlet"
          ? parseRequiredPositiveInteger(
              outletId
            )
          : parseRequiredPositiveInteger(
              depotId
            );


      if (!assignmentId) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              `Select a valid ${assignmentType}.`,
          });
      }


      const result =
        await registerStaffMember({
          role,
          userId,
          fullName,
          email,
          phone,
          password,

          outletId:
            assignmentType ===
            "outlet"
              ? assignmentId
              : null,

          depotId:
            assignmentType ===
            "depot"
              ? assignmentId
              : null,
        });


      if (!result.success) {
        const responseByReason = {
          INVALID_USER_ID_FORMAT: {
            status: 400,
            message:
              "The User ID prefix does not match the selected staff role.",
          },

          USER_ID_EXISTS: {
            status: 409,
            message:
              "That User ID is already in use.",
          },

          EMAIL_EXISTS: {
            status: 409,
            message:
              "That email address is already registered.",
          },

          WEAK_PASSWORD: {
            status: 400,
            message:
              result.message,
          },

          OUTLET_NOT_FOUND: {
            status: 404,
            message:
              "The selected outlet was not found.",
          },

          OUTLET_INACTIVE: {
            status: 400,
            message:
              "The selected outlet is inactive.",
          },

          DEPOT_NOT_FOUND: {
            status: 404,
            message:
              "The selected depot was not found.",
          },

          DEPOT_INACTIVE: {
            status: 400,
            message:
              "The selected depot is inactive.",
          },

          INVALID_ROLE: {
            status: 400,
            message:
              "Invalid staff role.",
          },
        };

        const mapped =
          responseByReason[
            result.reason
          ];


        return res
          .status(
            mapped?.status ||
            400
          )
          .json({
            success: false,

            message:
              mapped?.message ||
              `Unable to register the ${roleLabel.toLowerCase()} account.`,
          });
      }


      return res
        .status(201)
        .json({
          success: true,

          message:
            `${roleLabel} account registered successfully.`,

          staff:
            result.staff,
        });
    } catch (error) {
      return next(error);
    }
  };
}


export const registerStoreManager =
  createStaffRegistrationHandler({
    role:
      "STORE_MANAGER",

    roleLabel:
      "Store Manager",

    assignmentType:
      "outlet",
  });


export const registerDispatcher =
  createStaffRegistrationHandler({
    role:
      "DISPATCHER",

    roleLabel:
      "Dispatcher",

    assignmentType:
      "depot",
  });


export const registerLoader =
  createStaffRegistrationHandler({
    role:
      "LOADER",

    roleLabel:
      "Loader",

    assignmentType:
      "depot",
  });


export const registerDriver =
  createStaffRegistrationHandler({
    role:
      "DRIVER",

    roleLabel:
      "Driver",

    assignmentType:
      "depot",
  });


// ============================================================
// REGISTRATION ASSIGNMENT OPTIONS
// ============================================================

export async function getAdminOutlets(
  req,
  res,
  next
) {
  void req;


  try {
    const outlets =
      await getActiveOutlets();


    return res
      .status(200)
      .json({
        success: true,
        outlets,
      });
  } catch (error) {
    return next(error);
  }
}


export async function getAdminDepots(
  req,
  res,
  next
) {
  void req;


  try {
    const depots =
      await getActiveDepots();


    return res
      .status(200)
      .json({
        success: true,
        depots,
      });
  } catch (error) {
    return next(error);
  }
}
