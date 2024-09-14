export const getVersions = async () => {
  const url =
    "https://api.github.com/repos/evolvedev-inc/versions/contents/versions.json?ref=main";

  try {
    const data = await fetch(url);
    const jsonData = await data.json();

    let parsedContent = {};

    const base64Content = jsonData?.content ?? "";
    const content = Buffer.from(base64Content, "base64").toString("utf-8");

    parsedContent = JSON.parse(content);
    return parsedContent;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

await getVersions();
