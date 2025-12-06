import { METADATA } from "../../../lib/utils";

export async function GET() {
  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjE5MTU1NCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDI4NTQ1OUREQzA2NDkwOGQ4NjAzYjc2MjIzMDNkZEUzMEM0OTY2ZTUifQ",
      payload: "eyJkb21haW4iOiJzZWNyZXRzYW50YS5xdWVzdCJ9",
      signature:
        "dynzrSREXB0D4siEne2Ep/qjMgB3fF98viSjiK+l6NcEdF468tYKevfe87J4NSoMSnAke0MEoTHNVnzzEXm+lBs=",
    },
    frame: {
      version: "1",
      name: METADATA.name,
      iconUrl: METADATA.iconImageUrl,
      homeUrl: METADATA.homeUrl,
      imageUrl: METADATA.bannerImageUrl,
      splashImageUrl: METADATA.iconImageUrl,
      splashBackgroundColor: METADATA.splashBackgroundColor,
      description: METADATA.description,
      ogTitle: METADATA.name,
      ogDescription: METADATA.description,
      ogImageUrl: METADATA.bannerImageUrl,
      requiredCapabilities: [
        "actions.ready",
        "actions.signIn",
        "actions.openMiniApp",
        "actions.openUrl",
        "actions.sendToken",
        "actions.viewToken",
        "actions.composeCast",
        "actions.viewProfile",
        "actions.setPrimaryButton",
        "actions.swapToken",
        "actions.close",
        "actions.viewCast",
        "wallet.getEthereumProvider",
      ],
      requiredChains: ["eip155:8453", "eip155:10"],
      canonicalDomain: "https://secretsanta.quest",
      noindex: false,
      tags: ["santa", "secretsanta", "xmas", "christmas", "holidays"],
    },
    baseBuilder: {
      allowedAddresses: ["0x8342A48694A74044116F330db5050a267b28dD85"],
    },
  };

  return Response.json(config);
}
