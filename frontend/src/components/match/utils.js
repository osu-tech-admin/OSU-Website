const matchCardColors = {
  pool: [
    "blue",
    "green",
    "pink",
    "indigo",
    "purple",
    "lime",
    "red",
    "fuchsia",
    "cyan"
  ],
  cross_pool: ["yellow", "red", "fuchsia"],
  bracket: [
    ["cyan", "indigo", "sky"],
    ["cyan", "indigo", "sky"],
    ["cyan", "indigo", "sky"],
    ["cyan", "indigo", "sky"],
    ["cyan", "indigo", "sky"]
  ],
  position_pool: ["lime", "pink", "emerald"]
};

export const getMatchCardColor = match => {
  let color = "";
  if (match && match.pool) {
    color = matchCardColors["pool"][match.pool.sequence_number - 1];
  } else if (match && match.cross_pool) {
    color = matchCardColors["cross_pool"][match.sequence_number - 1];
  } else if (match && match.bracket) {
    color =
      matchCardColors["bracket"][match.bracket.sequence_number - 1][
        match.sequence_number - 1
      ];
  } else if (match && match.position_pool) {
    color =
      matchCardColors["position_pool"][match.position_pool.sequence_number - 1];
  }
  return color;
};
