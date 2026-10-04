import LanguageSelector from "./LanguageSelector";


function LoginUtilityBar() {
  return (
    <div
      className="
        flex
        min-h-10
        w-full
        items-center
        justify-end
        pr-12
        sm:pr-12
      "
    >
      <div
        className="
          hidden
          sm:block
        "
      >
        <LanguageSelector />
      </div>

      <div
        className="
          sm:hidden
        "
      >
        <LanguageSelector
          compact
        />
      </div>
    </div>
  );
}


export default LoginUtilityBar;
