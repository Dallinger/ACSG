/* eslint no-console: off */
/* global require */

var acsg = require('./acsg')

var game = acsg.Game({ 'config': {
  NUM_PLAYERS: 9,
  DURATION: 60,
  INCLUDE_HUMAN: true,
  BOT_STRATEGY: 'random',
  ROWS: 25,
  COLUMNS: 25,
  NUM_FOOD: 8,
  VISIBILITY: 50,
  BOT_MOTION_RATE: 4,
  BLOCK_SIZE: 12,
  BLOCK_PADDING: 1,
  SEED: '19145822646'
}})

game.run(function () { console.log(game.serializeActions()) })

// g = {'id': '9ecf49af-b9b6-42a4-bb17-9d833f2fef99', 'data': {'actions': ['right', 'right', 'right', 'up', 'left', 'left', 'up', 'up', 'up', 'up', 'up', 'right', 'down', 'down', 'down', 'down', 'down', 'down', 'down', 'down', 'left', 'left', 'down', 'down', 'left', 'down', 'down', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'down', 'down', 'down', 'down', 'down', 'down', 'down', 'down', 'right', 'right', 'right', 'down', 'down', 'right', 'right', 'right', 'right', 'right', 'up', 'down', 'down', 'right', 'right', 'right', 'right', 'left', 'left', 'up', 'up', 'left', 'up', 'up', 'up', 'up', 'left', 'left', 'up', 'up', 'up', 'left', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'right', 'right', 'down', 'down', 'down', 'down', 'down', 'down', 'down', 'down', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'up', 'up', 'up', 'up', 'up', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'down', 'down', 'left', 'left', 'down', 'down', 'left', 'left', 'left', 'left'], 'timestamps': [0.3936000000103377, 0.561199999996461, 0.7281000000075437, 0.8938000000198372, 1.0938000000023749, 1.2613000000128523, 1.377200000017183, 1.5278000000107568, 1.6604999999981374, 1.8270999999949709, 1.9605000000155997, 2.160200000012992, 2.343800000002375, 2.493900000001304, 2.6098000000056345, 2.7761999999929685, 2.9275000000197906, 3.0605000000214204, 3.2098000000114553, 3.3769000000029337, 3.4611000000149943, 3.6107999999949243, 3.760500000003958, 3.8932000000204425, 4.027100000006612, 4.193800000008196, 4.343699999997625, 4.510399999999208, 4.644300000014482, 4.7766000000119675, 4.910800000012387, 5.044099999999162, 5.159400000004098, 5.310300000011921, 5.443499999993946, 5.593599999992875, 5.727100000018254, 5.84340000001248, 5.992800000007264, 6.110600000014529, 6.242800000007264, 6.394100000004983, 6.510800000018207, 6.642600000021048, 6.794300000008661, 6.9267000000108965, 7.110799999994924, 7.243900000001304, 7.4275999999954365, 7.560900000011316, 7.710600000020349, 7.860500000009779, 8.010800000018207, 8.159400000004098, 8.359800000005635, 8.510899999993853, 8.593900000007125, 8.743700000020908, 8.876400000008289, 9.027400000020862, 9.192800000018906, 9.359700000000885, 9.410800000012387, 9.544099999999162, 9.626799999998184, 9.742499999993015, 9.926200000016252, 10.093599999992875, 10.260399999999208, 10.35920000000624, 10.527400000020862, 10.677200000005541, 10.827699999994365, 10.9600999999966, 11.143700000015087, 11.309999999997672, 11.477100000018254, 11.644000000000233, 11.793700000009267, 11.94330000001355, 12.09350000001723, 12.243500000011409, 12.376300000003539, 12.527400000020862, 12.627200000017183, 12.777400000020862, 12.893200000020443, 13.043900000018766, 13.192899999994552, 13.32719999999972, 13.459900000016205, 13.610500000009779, 13.743700000020908, 13.910399999993388, 14.075800000020536, 14.22609999999986, 14.377299999992829, 14.527000000001863, 14.660200000012992, 14.810599999997066, 14.96020000000135, 15.109800000005635, 15.277200000011362, 15.51469999999972, 15.62609999999404, 15.777300000016112, 15.892500000016298, 16.043800000014016, 16.193800000008196, 16.34320000000298, 16.49350000001141, 16.643800000019837, 16.793800000014016, 16.943499999993946, 17.092700000008335, 17.260500000003958, 17.392500000016298, 17.55999999999767, 17.71020000000135, 17.86040000000503, 18.025900000007823, 18.176700000010896, 18.35950000002049, 18.443700000003446, 18.527000000001863, 18.693900000012945, 18.842499999998836, 18.993700000020908, 19.159400000004098, 19.30920000001788, 19.477000000013504, 19.659299999999348, 19.793900000018766]}, 'config': {'NUM_PLAYERS': 9, 'DURATION': 20, 'INCLUDE_HUMAN': true, 'BOT_STRATEGY': 'random', 'ROWS': 25, 'COLUMNS': 25, 'NUM_FOOD': 8, 'VISIBILITY': 50, 'BOT_MOTION_RATE': 4, 'BLOCK_SIZE': 12, 'BLOCK_PADDING': 1, 'SEED': '19145822646'}}
//
// game = ACSG(g)
//
// game.run()
