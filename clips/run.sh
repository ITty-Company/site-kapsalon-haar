#!/bin/zsh
# Haar! — LTX first/last-frame clips, ONE AT A TIME. usage: [SEED=n] zsh sites/kapsalon-haar/clips/run.sh [ids]
cd /Users/anastasiia.krasnova/Projects/site-factory
PY=~/.local/share/itty-video/.venv/bin/python
K=sites/kapsalon-haar/kf
C=sites/kapsalon-haar/clips
PRE="One continuous shot, no cuts, photoreal, cinematic, soft natural light, silent, constant smooth speed, gentle parallax, nothing appears or disappears except what is described, no people, no hands."
NEG="hands, fingers, arms, people, person, human, face, body, holding, grabbing, text, letters, numbers, logo, watermark, label, duplicate objects, extra brushes, extra bowls, morphing objects, melting, objects appearing, cuts, jittery, flicker, blurry, worst quality"
typeset -A A B P S
A[f1]=k1; B[f1]=k2; S[f1]=11; P[f1]="$PRE A very slow push-in toward the black tint bowl on the zinc-grey counter; inside the bowl glossy copper-orange colour cream slowly rises and swirls into a soft peak. The hair lock, towel, foil roll and brush lie perfectly still."
A[f2]=k2; B[f2]=k3; S[f2]=12; P[f2]="$PRE The camera slowly lowers toward the counter; a sheet of shiny aluminium foil unrolls smoothly across the white towel under the hair lock, and glossy copper colour slowly spreads down along the lower part of the lock like ink soaking in. Everything else lies still."
A[f3]=k3; B[f3]=k4; S[f3]=13; P[f3]="$PRE A slow gentle push-in; the shiny aluminium foil slowly folds over by itself in three, closing into a neat flat packet around the hair lock; a warm sunbeam slides across the counter. The bowl and brush lie perfectly still."
A[f5]=k5; B[f5]=k5; S[f5]=15; P[f5]="$PRE Locked-off static camera. Clear water keeps pouring from the chrome spout into the white basin, copper-tinted water swirls gently around the hair lock toward the drain, droplets sparkle. The basin and spout do not move."
A[f6]=k6; B[f6]=k6; S[f6]=16; P[f6]="$PRE Locked-off camera with a very slow push-in. A soft warm breeze gently lifts and sways a few strands of the glossy copper hair lock on the towel, golden sunlight shimmers across the hair. The dryer and brush lie perfectly still."
A[of]=o1; B[of]=o2; S[of]=21; P[of]="$PRE A slow steady forward dolly along the empty brick-paved shopping street toward the salon window with the deep teal frame while the morning light slowly turns into warm evening glow; no people, no cars, no readable signs."
A[al]=a1; B[al]=a1; S[al]=31; P[al]="$PRE Locked-off static camera, the frame does not move. Soft sunlight patterns drift slowly across the floor and the teal chair, dust motes float in the light. Everything else is perfectly still."
A[cl]=o2; B[cl]=o2; S[cl]=41; P[cl]="$PRE Locked-off static camera, the frame does not move. The warm lamps inside the salon window glow and flicker very slightly, raindrops ripple in the puddles on the brick pavement, leaves of the plant sway gently. Everything else is perfectly still."
if (( $# )); then LIST=($@); else LIST=(f1 f2 f3 f5 f6 of al cl); fi
for c in $LIST; do
  out=$C/$c.mp4
  if [[ -f $out ]]; then echo "== $c exists, skip"; continue; fi
  sd=${SEED:-${S[$c]}}
  echo "== clip $c seed $sd $(date +%T)"
  caffeinate -i nice -n 10 $PY tools/ltx_flf.py $K/${A[$c]}.webp $K/${B[$c]}.webp $out.tmp.mp4 --prompt "${P[$c]}" --neg "$NEG" --seed $sd 2>&1 | grep -E "ok |Error|error|Traceback"
  [[ -f $out.tmp.mp4 ]] && mv $out.tmp.mp4 $out
done
echo "== ALL DONE $(date +%T)"
