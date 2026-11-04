// Bloons dart-thrower: step 2, clicking changes a counter.

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Bloons Dart Thrower";

// The resource: pops. One pop per dart hit, and every throw hits for now.
let pops = 0;

const popDisplay = document.createElement("p");
popDisplay.id = "pops";
popDisplay.textContent = "0 pops";

const dartButton = document.createElement("button");
dartButton.id = "throw-dart";
dartButton.type = "button";
dartButton.textContent = "Throw Dart";

dartButton.addEventListener("click", () => {
  pops += 1;
  popDisplay.textContent = `${pops} pops`;
});

app.append(heading, popDisplay, dartButton);
