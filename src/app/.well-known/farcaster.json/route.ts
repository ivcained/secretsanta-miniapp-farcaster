import { METADATA } from "../../../lib/utils";

export async function GET() {
  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjEyMTQyLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4MDRlNkYxMTFlQmY2RkQyNTU3NmQ0ODA0ODA5NjI0MzVEYzNhYThEOCJ9",
      payload: "eyJkb21haW4iOiJmcmFtZXMtdjItZGVtby1saWxhYy52ZXJjZWwuYXBwIn0",
      signature:
        "MHg5MGI1YzA0Zjc3MGY1M2I4M2I3OGQzOTMwNTNjMmJjZjUwNmE3ZThjNDViYmEwNDk2OTcwZTM1ZTQ0YzU2MGU1Nzc4Y2Y1ZTJkNDY2YzE1MWQxNGMzYmFjNzM3ZDcxZGEwZDVjYWJmMGMzZTdhYTc2YzRjMmQ5MmE5NDJhYjkyODFj",
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
      allowedAddresses: ["0xF928350196dFb7e9D7e0391180B7fbe25c7cdC98"],
    },
  };

  return Response.json(config);
}
