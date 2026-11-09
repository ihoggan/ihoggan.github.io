# ihoggan.github.io

The source of my site: **https://ihoggan.github.io/**

I'm Iain Hoggan, a network technician in the UK. I build things on hardware other people throw away, and I measure them honestly, including when the measurement says I'm wrong.

Everything here is free, needs no sign-up, and works on a phone. The whole site can also be [kept for offline use](https://ihoggan.github.io/offline.html), so it still works with no signal.

## Case studies

What went wrong, how it was found, and what it cost.

- [Saved from the scrap pile](https://ihoggan.github.io/reclaim.html): a 2015 desktop PC headed for scrap, now running Ubuntu, a local AI model and characters that remember me. Includes the measurement that showed the characters' memories were entirely invented, and the fix. Code: [localcast](https://github.com/IHoggan/localcast), [nix6-tools](https://github.com/IHoggan/nix6-tools).
- [Meet Gus](https://ihoggan.github.io/gus.html): the same scrap PC as a family robot, with a face that reacts to his own vital signs and a GO / NO-GO check before he gets a personality.
- [HUSTLER](https://ihoggan.github.io/Hustler.html): a UK blackball pool physics engine built over seventy revisions, the calibration bug that made its AI think it never missed, and five confident wrong answers on the way. Code: [hustler](https://github.com/IHoggan/hustler).

## Learning paths

Free guides, in order. Every step asks you to **predict, try it, and check**, so you understand what happened, not just that it worked.

| Path | Steps |
|---|---|
| **Security:** lock your own doors | [Who holds the keys to your life?](https://ihoggan.github.io/account-audit.html) → [Securing Ubuntu](https://ihoggan.github.io/secure-ubuntu.html) → [Is it the real thing?](https://ihoggan.github.io/real-thing.html) → [Phone clean-up](https://ihoggan.github.io/phone-cleanup.html) → [Browse like you mean it](https://ihoggan.github.io/secure-browsing.html) |
| **AI:** from one neuron to a language model | [S.M.A.R.T.](https://ihoggan.github.io/neural_playground.html) → [Guess the next word](https://ihoggan.github.io/next-word.html) → [Where does "dog" live?](https://ihoggan.github.io/word-map.html) |
| **Ready, not scared:** for when things go wrong | [When the lights go out](https://ihoggan.github.io/power-cut.html) → [The lean toolkit](https://ihoggan.github.io/lean-toolkit.html) → [Living safely with lithium batteries](https://ihoggan.github.io/battery-safety.html) → [Prepare now, relax later](https://ihoggan.github.io/offline-tools.html) |
| **Linux:** from first command to your own network | [Meet the terminal](https://ihoggan.github.io/terminal.html) → [How networks work](https://ihoggan.github.io/networking.html) → [A reminder that never forgets](https://ihoggan.github.io/timers.html) |
| **Hardware:** from a battery to a Wi-Fi clock | [Electronics: first light](https://ihoggan.github.io/electronics-1.html) → [Stripes, storage and switches](https://ihoggan.github.io/electronics-2.html) → [The 555 jumper bench](https://ihoggan.github.io/electronics-3.html) → [Hand the switch to a computer](https://ihoggan.github.io/pi-gpio.html) → [A Wi-Fi clock on a stick](https://ihoggan.github.io/esp32-clock.html) |
| **Radio:** see what's in the air | [Software-defined radio](https://ihoggan.github.io/sdr.html) → [Got my ears on](https://ihoggan.github.io/ears-on.html) → [Do you need a TV licence?](https://ihoggan.github.io/tv-licence.html) |
| **Data:** penguins, by the numbers | [NumPy](https://ihoggan.github.io/data-numpy.html) → [pandas](https://ihoggan.github.io/data-pandas.html) → [matplotlib](https://ihoggan.github.io/data-plots.html) → [scikit-learn: your first model](https://ihoggan.github.io/data-ml.html) |
| **Build your own:** a website like this one | [Would you like a website like this?](https://ihoggan.github.io/website.html) → [From a fresh machine to your first push](https://ihoggan.github.io/github-setup.html) → [Look before you leap](https://ihoggan.github.io/preflight.html) → [Make your website work with no signal](https://ihoggan.github.io/offline-site.html) |

## Things you can run in your browser

- [S.M.A.R.T.](https://ihoggan.github.io/neural_playground.html): watch a single neuron learn, then push the learning rate until it breaks.
- [The 555 jumper bench](https://ihoggan.github.io/electronics-3.html): change the parts around a 555 timer and watch the scope trace and the tone change with them.
- [TradeWar](https://ihoggan.github.io/TradeWar.html): trade against a rule-following bot and see how long your discipline lasts.

**Archive (2025):** beginner guides to Linux, Python and the Raspberry Pi, and a rocks and minerals reference, listed under [All projects](https://ihoggan.github.io/portfolio.html#earlier).

## How it's built

Plain HTML, CSS and JavaScript with one shared stylesheet (`site.css`). No framework, no build step for the pages, hosted on GitHub Pages.

Offline support comes from a service worker (`sw.js`). After adding or changing pages, rebuild its file list:

```bash
python3 tools/build_offline.py
```

## Corrections

Found something wrong? [Open an issue](https://github.com/IHoggan/ihoggan.github.io/issues). Corrections are genuinely welcome.

## Licence

MIT. See [LICENSE](LICENSE).
