workflow "Call external API" {
  on = "push"
  resolves = ["Call Node-RED"]
}

action "Call Node-RED" {
  uses = "swinton/httpie.action@8ab0a0e926d091e0444fcacd5eb679d2e2d4ab3d"
  secrets = ["GITHUB_TOKEN"]
  args = ["POST", "https://numerous-mosquito-9311.dataplicity.io/nodered/github", "hello=world"]
}
