import { activateXR, checkXR, xrButton } from "./session";

const init = async () => {
  try {
    const sessionSupported = await checkXR();
    if (sessionSupported) {
      xrButton.addEventListener('click', activateXR);
    }
  } catch (error) {
    alert("not compatible" + error);
  }
};

init();