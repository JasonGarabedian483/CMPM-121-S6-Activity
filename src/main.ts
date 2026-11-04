// Bloons dart-thrower: step 1, a button you can click.

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Bloons Dart Thrower";

// The main action: throw a dart at the bloon line.
const dartButton = document.createElement("button");
dartButton.id = "throw-dart";
dartButton.type = "button";
dartButton.textContent = "Throw Dart";

let throws = 0;
dartButton.addEventListener("click", () => {
  throws += 1;
  console.log(`Dart thrown! Total throws: ${throws}`);
});

app.append(heading, dartButton);
