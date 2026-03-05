## Packages
(none needed)

## Notes
- WebRTC signaling relies on WebSocket connection at `/ws`
- WS messages expect format: `{ type: string, payload: any }`
- Native standard WebRTC APIs used (`RTCPeerConnection`, `getUserMedia`)
- Profile state maintained in `sessionStorage` for lightweight persistence between routes
- User's camera permissions are requested immediately before joining the matchmaking queue
