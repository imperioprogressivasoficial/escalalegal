#!/bin/bash
# uso: preview.sh arquivo [paginas]  -> PNG(s) em extras-preview
P=${PREVIEW:-/tmp/extras-preview}; mkdir -p $P/tmp
f="$1"; n=$(basename "${f%.*}"); ext="${f##*.}"; pags=${2:-1}
if [ "$ext" != pdf ]; then soffice --headless --convert-to pdf --outdir $P/tmp "$f" >/dev/null 2>&1; pdf=$P/tmp/$n.pdf; else pdf="$f"; fi
pdftoppm -png -r 70 -f 1 -l $pags "$pdf" "$P/$n-$ext"
