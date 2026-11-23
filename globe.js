/* ------------------------------------------------------------------
   Rotating dot-matrix globe marking the countries that have cited the
   author's research.

   Land geometry is a 288 x 144 land/sea mask rasterised from Natural
   Earth 110m coastlines. Country borders come from the same Natural
   Earth release. Citation counts per country come from the OpenAlex
   citation graph (see README) and are compiled into the CITED table.

   Everything is embedded below, so the widget needs no network access
   and no third-party library at runtime.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var canvas = document.getElementById('globe');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var glCanvas = document.getElementById('globe-gl');

  /* Countries with at least one citing paper: [ISO 3166-1 alpha-2, name, citing works] */
  var CITED = [
    ["CN", "China", 33],
    ["US", "United States", 25],
    ["AU", "Australia", 9],
    ["SG", "Singapore", 8],
    ["DE", "Germany", 7],
    ["GB", "United Kingdom", 7],
    ["IN", "India", 6],
    ["HK", "Hong Kong", 5],
    ["IT", "Italy", 4],
    ["CA", "Canada", 3],
    ["CZ", "Czechia", 3],
    ["MA", "Morocco", 3],
    ["NL", "Netherlands", 3],
    ["ES", "Spain", 3],
    ["AT", "Austria", 2],
    ["BD", "Bangladesh", 2],
    ["BR", "Brazil", 2],
    ["FR", "France", 2],
    ["ID", "Indonesia", 2],
    ["IR", "Iran", 2],
    ["IQ", "Iraq", 2],
    ["JP", "Japan", 2],
    ["LV", "Latvia", 2],
    ["MY", "Malaysia", 2],
    ["SO", "Somalia", 2],
    ["KR", "South Korea", 2],
    ["CH", "Switzerland", 2],
    ["BE", "Belgium", 1],
    ["BG", "Bulgaria", 1],
    ["CL", "Chile", 1],
    ["CO", "Colombia", 1],
    ["HR", "Croatia", 1],
    ["DO", "Dominican Republic", 1],
    ["EC", "Ecuador", 1],
    ["EG", "Egypt", 1],
    ["ET", "Ethiopia", 1],
    ["GR", "Greece", 1],
    ["HU", "Hungary", 1],
    ["IE", "Ireland", 1],
    ["JO", "Jordan", 1],
    ["MO", "Macau", 1],
    ["NO", "Norway", 1],
    ["PL", "Poland", 1],
    ["RU", "Russia", 1],
    ["TR", "Turkey", 1],
    ["AE", "United Arab Emirates", 1],
    ["VN", "Vietnam", 1]
  ];

  /* One byte per land dot, in draw order: index into CITED (1-based), 0 = no citations */
  var CIDS = 'CgAACgoKCgAAAAAACgoKCgoKAAAAAAAAAAAAAAAAACosLCwsCgoKCgAAAAAAAAAAAAAAACoqKiwsCgoKCgoAAAAAAAAAAAAAAAAAACoqLAoKCgoKCgAAAAAAAAAAAAAAAAAAKiwsLAoKCgoKCgAAAAAAAAAAAAAsLCwsLCwsLCwsCgAAAAAAAAAAAAAsLCwsLCwsLAoKCgoKCgoKCgAAAAAAAAAALCwsLCwsLCwsLCwsCgoKCgoKCgoAAAAAAAAAACwsLCwsLCwsLCwsLCwsLCwsLAICCgoKCgoKCgoKCgAAAAAAAAAAKiwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwCAgICAgICAgIKCgoKCgoKCgoKCgoKCgoKCgoKCgoAAAAAAAAAAAAAKioqACwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwCAgICAgICAgICCgoKCgoKCgoKCgoKCgoKCgoKCgAAAAAAAAAAACoAAAAAACwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLAICAgICAgICAgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgAAAAAAAAAAKgAAAAAALCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLAICAgICAgICAgICCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgAAAAAAAAAAACoAAAAAACwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwCAgICAgICAgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgAAAAAAAAAqKgAAAAAALCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLAICAgICAgICAgICCgoKCgoKCgoKCgoKCgoKCgoKCgoKAAAAKioAAAAAAAAALCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwCAgICAgICAgICCgoKCgoKCgoKCgoKCgoKCgoKCgoKAAAAKioqAAAAAAAsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwCAgICAgICAgoKCgoKCgoKCgoKCgoKCgoKCgoKCgAqKioAAAAAACwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLAICAgICCgoKCgoKCgoKCgoKCgoKCgoKCgoKKioqAAAAACwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwCAgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoGAAAALCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwCCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKBgAAFxcsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLAICCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgYGAAAAAAAsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgYGBSssAAAAACwsLCwsLCwsLCwsLCwAAAAsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKJycGBgYGDQ0FBQUFBSsrKysrKysrAAAAAAAALCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsAAAAAAAAAAAAAAAAACwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsAQEBLCwsLCwsLCwsLCwsLCwsLCwKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKJycGBgYGBg0NBQUFBQUFBSsrKysrKysAAAAAAAAAACwsLCwsLCwsLCwsLCwsLCwsLCwsLAAAAAAAAAAAAAAAAAAAACwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLAEBAQEBLCwsLCwsLCwsLCwsLCwsLAoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoGBgYSEhwcBQUFBQUFCwsrKysrKysAAAAAAAAAAAAsLCwsLCwsLCwsLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsLCwsLCwALCwsLAAAAAAsLCwsLCwsLCwsLCwsAQEBAQEBASwsLCwsLCwsLCwsCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKEhISEhISBQUFBQULCwsLCwAAKwAAAAAAAAAAAAAAAAAALCwsLCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsAAAAAAAAAAAAAAAAAAAAACwsAAAAAAEBAQEBAQEBAQEBLCwsLCwsLCwsLAICAgICAgICAgICAgICAgICAgICAgICAgICAgoCCgoKCgoKCgoKCgoKCgoKCgoKCgoKChISEhISEhISEhIFBQUFDw8PDwAmJiYAAAAAAAAAAAAAAAAAACwsLCwsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQEsLAEsLCwsAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgoKCgoKCgoKCgoKCgICCgoKChISEhISEhIbGxsPCQ8PDyYmJiYAAAAAAAAAAAAAAAAALCwsLCwsLCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBASwsLCwsAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIKCgoKCgoKCgoKCgICCgoKCgoKEhISEhISCQkJCQkAICAgAAAAAAAAAAAALCwsLCwsLCwsLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQEBAQEBLCwsAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICCgoKCgoCAgICAgICCgoSEhISEhISCQkJCSAAAAAAAAAAAAAALCwsLCwsLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAQEBAQEBLCwsLBYWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgoKCgICAgICAgIODg4ODg4SEhISCQkJAAAAAB0dHR0AACwsLCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAQEAAAAAAAAAAAAAAAABAQEBAQEBAQEBAQEBAQEBLCwWFhYWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgAADg4ODg4ODhIJCQkJAAAAHR0dLS0tAAAAACwsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAABYCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAAAODg4ODg4JCQkAACUlLS0tLS0tLS0tLS0tLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAFgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgAADg4ODg4OCQklJSUtLS0tLS0tLS0tLS0tLRQAABQAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAABYWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIADg4ODg4OJSUtLS0tLS0tLS0tLS0tLRQUFBQAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAABoWFgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIODg4AAAAAJS0tLS0tLS0tAC0AABUVFBQUFBQUFBQUFAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBGhoaFhYWFgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgwAAAAAAAAAAAAAAAAAABUVFRUUFBQUFBQUFBQUFBQAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBARoaGhYWFhYCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDAwMDAAAAAAAAAAAAAAAAAAVFRUUFBQUFBQUFBQUFBQUAAAAAAAAAAAAAAcHBwcBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEWFhYWAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgwMDAwMDAAAAAAAAAAAAAAAAAAVFRUVFRUUFBQUFBQUFBQUFBQAAAAAAAAAAAAABwcHBwEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEWFhYAAAACAgICAgICAgICAgICAgICAgICAgICAgICDAwMDAwMAAAAAAAAAAAAAAAAAAAAAAAAKCgoABUVFRUVFRQUFBQUFBQUFBQUAAAAAAAAAAAAAAAHBwcBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBFgAAAAAAAAACAgICAgICAgICAgICAgICAgICDAwMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIyMjIyMjIyMoKAAAAAAVFRUVFBQUFBQUFBQUFBQAAAAAAAAAAAAABwcHBwcBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAIAAgICAgICAgICDAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMjIyMjIyMjKAAAAAAAAAAVABQUFBQUFBQUFAAAAAAAAAAAAAcHBwcHBwAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAAAAgICAgIMDAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjIyMjIyMAAAAAAAAAAAAAABQUFBQUFBQUFAAAAAAAAAAABwcHBwcHBwAAAAABAQEBAQcHBwcBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAAAAAAAAAAICAgwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjIyMjIyMjAAAAAAAAAAAAAAAUFBQUFBQAAAAAAAcHBwcHBwcHBwcHBwAAAAAAAAcHBwAAAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAAAAgwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIyMjIyMjIyMAAAAAAAAAAAAAFBQAAAAAAAAABwcHBwcHBwcHBwcHBwcHEAcHBwcAAAABAQEBAQEBAQEBAQEBAQEBAQAAAAAAAAAAAAwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIyMjIyMjIyMAAAAAAAAAAAAAAC4uAAAABwcHBwcHBwcHBwcHBwcQEBAHBwAAAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAAMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjIyMjIyMjIwAAAAAAAAAAAAAALi4AAAAHBwcHBwcHBwcHBwcHBwcHEBAQBwAAAAABAQEBAQEBAQEBAQEBAQAAAAAAAAAAAAAMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwcHBwcHBwcHBwcHBwcHAAAAAAAAAQAvLy8vAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwcHBwcHBwcHBwcHAAAAAAAAAAAAAC8CAAAAAAAAAAAAAAAhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHBwcHBwcHBwcHAAAAAAAAAAAvLwEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwcHBwcHBwcHAAAAAAAAAAAALwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHBwcHBwcHAAAAAAAAAAAALwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcHBwcHAAAAAAAAAAAvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQkAAAAAAAABwcHBwAAAAAAAAAALwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQkJCQAAAcHBwcAAAAAAAAvAAAAHwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJCQkJCQAGQcHBwcAAAAALy8AAB8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQkJCQkJCQAAAAAGRkHBwcAAC8vAAAAAB8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJCQkJCQkJCQAAAAAGQcHAC8AAAAAAB8fHx8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkJCQkJCQkJCQkABkZAAAAAAAfHx8fHx8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkJCQkJCQkJCQkGRkZAAAYAB8fHx8fHx8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQkJCQkJCQkGRkZGBgYGB8fHx8fHx8fAAAAAAARAAAAABISEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQkJCQZGRkZExMYGBgAGBgYHx8fHx8fHx8AABEREREAAAAAABIRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkZGRkTExgYGBgTEx8fHx8fHx8fHwAAABEREQAAERERERERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkZGRMTExgYGBgTEyIiHx8fHx8fEREREREREREREREREREREQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGRMTExMTExMTExMTExMTEyIiIiIfHx8fEREREREREREREREREREREREAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkTExMTExMTExMTExMiIiIiAAAfHx8REREREREREREREREREREREREREQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAExMTExMTExMTExMTIiIAAAAAAAAREREREREREREREREREREREREREREREREAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATExMTExMTExMTExMTExMTExMAAAAiAAAAAAAAERERERERERERERERERERERERERERERERERERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATExMTExMTExMAAAAAAAAAAAAAABEREREREREREREREREREREREREREREREREREREREQAAAAAAAAAAAAAAAAAAAAAAAAAAABMTExMAAAAAAAAAAAAAABEREREREREREREREREREREREREREREREREREREREREAAAAAAAAAAAAAAAAAAAAAAAAAAAAAExMTExMTEwAAAAAAAAAAAAAAEREREREREREREREREREREREREREREREREREREREREQAAAAAAAAAAAAAAAAAAAAAAAAAAABMTExMTExMAAAAAAAAAAAARERERERERERERERERERERERERERERERERERERERERAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMAAAAAAAAAEREAABERERERERERERERERERERERERERERERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARERERERERERERERERERERERERERERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAEREREREREREREREREREREREREQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwMDAwMDAwAAAAAAAAAAAAAAAAAREREREREREREREREREREREQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwMDAwMDAwMAAAAAAAAAAAAAAAAREREREREREREREREREREREQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwMDAwMDAwMDAwMDAwAAAAAAAAAAAAAAABEREREREREREREREREREREAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwAeAAAAAAAAAAAAEREREREREREREREREREAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwAeAAAAAAAAAAAAEREREREREREREREREREAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMeAAAAAAAAAAAAEREREREREREREREREREAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAB4eAAAAAAAAAAARERERERERERERERERAAAAAAAAAAAAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDHh4AAAAAAAAAAAAAERERERERERERAAAAAAAAAAAAAAAAAAAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAx4eAAAAAAAAAAAAAAAREREREQAAAAAAAAAAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDHh4AAAAAAAAAAAAAABERERERAAAAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDHh4AAAAAAAAAAAAAAAARERERAAAAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAx4AAAAAAAAAAAAAAAAREREREQAAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAx4AAAAAAAAAAAAAABERERERAAAAAAAAAAAAAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAx4AAAAAAAAAAAAAABERERERAAAAAAAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAx4AAAAAAAAAAAAAAAAAEREAAAAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDHgAAAAAAAAAAAAAAAAARAAAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMeHgAAAAAAAAAAAAAAAAAAAwMDAwMDAwMDAwMDAwMDAx4eAAAAAAAAAAAAAAMDAwMDAwMDAwAeAAAAAAAAAAAAAAAAAwMDAwMDAwMAHh4AAAAAAAAAAAAAAAMDAwMDAAAAHh4AAAAAAAAAAAAAHh4AAAAAAAAAAB4eAAAAAAADAwMAAAAAAAAAAAMAAB4eHgAAAAAAAAAAHh4eAAAAAAAAAB4eAAAAAAAeHgAAAAAAHgAAAAAAAB4eAAAAHh4AAAAAAAAeHh4eHgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

  var MASK = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO+AAAf/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///x/+//9BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAff/8f/////+AAAAAgAA+AAAAAPgAAAAAAAAAAAAAAAAAAAAAP7/Af/////4AAAH8AAAAAAAAAHwAAAAAAAAAAAAAAAAAAAAFgH+f//////wAAAD5gAAAAAAAAAMAAAAAAAAAAAAAAAAAB4AA4/8H//////wAAAAwAAAAAAgAAAHwAAAAAAAAAAAAAAAAAPmPDjgAAf////wAAAAAAAAAD4AAA///gAAPwAAAAAAAAAAAGAAAAAAAAP////wAAAAAAAAAOAAAH//8AAAAAAAAAAAAAAAAP2HHe7uAAD///+AAAAAAAAAAYAAD////+HgAAAAAAAAAAAAAff7Dg//AAD////AAAAAAAAABwAdf//////gD/AAAAAAD8AAAAP/gcf/8AD///9AAAAAAfAAAAB8///////////wAAAAf//4//H/zvDh/ABf//8AAAAAH/4AAA49////////////7+wB//////8HBvnBfgB//+AAAAAA///xh//+///////////////gP//////////Af8B//4AAAAAB///5v//9//////////////fj//////////8AfMA/+AB/AAAD/P8P//////////////////BAH/////////3jfwA/4AAfAAAP+f8//////////////////8AIv////////+AAHQAfwAAAAAA/5////////////////////+AB/////////4ADwAAPwAAAAAD/x//////////////////9/wAA/9n//////wAD8AABwAAAAAD/x/////////////////8D+AAAP5AP/////wAD8YAAAAAAAAD/4f///////////////+cOAAAAA4AAf////8AD/8AAAAAAAIAHgP//////////////+AAcAAAABgAAP/////gB/+AAAAAAAcATh///////////////4AB8AAAAMAAAP/////4D//AAAAAAAOA2B///////////////gAD8AAAAAAAAD//////P//wAAAAABnAYf///////////////wABwAAAAAAAAB//////H//4AAAAABvD//////////////////ABwAAAAAAAAA//////n//4AAAAADPn//////////////////gBgAAAAAAAABf////////IAAAAAAOf/////////////////8gAAAAAAAAAAAX///////EeAAAAAAB//////////////////8wAAAAAAAAAAAL//////9wfAAAAAAP//////////////////8AAAAAAAAAAAAH///////xBAAAAAAD/////f////////////4gAAAAAAAAAAAH////////AAAAAAAB/9//M/w///////////wAAAAAAAAAAAAH///////YAAAAAAAB/8/+Afz///////////hgAAAAAAAAAAAP//////8AAAAAAAB/4OP8APx//////////+DwAAAAAAAAAAAH//////8AAAAAAAB/wXn8MH4f/////////wCAAAAAAAAAAAAH//////gAAAAAAAB/gQ3l//8/////////vgCAAAAAAAAAAAAH//////AAAAAAAAD/AQTn//8f///////+TADAAAAAAAAAAAAD//////AAAAAAAAB/AABn//4f///////8DgGAAAAAAAAAAAAD/////+AAAAAAAAAcB4BD//+f////////xweAAAAAAAAAAAAB/////+AAAAAAAAAR/4AAB///////////BxcAAAAAAAAAAAAA/////8AAAAAAAAAf/wAAB///////////AGwAAAAAAAAAAAAAP////4AAAAAAAAB//4AAD///////////gOAAAAAAAAAAAAAAH////gAAAAAAAAD///DwD///////////gIAAAAAAAAAAAAAAE////gAAAAAAAAD///7/////////////gAAAAAAAAAAAAAAAC//xhgAAAAAAAAD///////z/////////wAAAAAAAAAAAAAAABf/gAwAAAAAAAAP/////z/5/////////gAAAAAAAAAAAAAAABP/AAwAAAAAAAAf/////5/8T////////AAAAAAAAAAAAAAAAAn/AAQAAAAAAAA//////8/8B////////AAAAAAAAAAAAAAAAAD/AAEAAAAAAAA//////8/+YA//////+gAAAAAAAAAAAAAAAAB/AAgAAAAAAAB//////8f/+Af/////4gAAAAAAAAAAAAAAAAA/ACMAAAAAAAD///////f//AP/+P//AAAAAAAAAAAAAAAAAAA/AwDAAAAAAAB///////P/+AD/8P/gAAAAAAAAAAAAQAAAAAA/hwAMAAAAAAB///////H/8AD/wH/mAAAAAAAAAAAAAAAAAAAP/wGIgAAAAAB///////n/4AD/gH/gAwAAAAAAAAAAAAAAAAAD/gAAAAAAAAB///////j/gAB/AD/wAwAAAAAAAAAAAAAAAAAAH+AAAAAAAAB///////z/AAB8AA/4AgAAAAAAAAAAAAAAAAAAD+AAAAAAAAD///////74AAA8AA/4AAAAAAAAAAAAAAAAAAAAAOAAAAAAAAB///////9AAAA8AAX4AgAAAAAAAAAAAAAAAAAAAGAIAAAAAAB///////8CAAA8AAT4AAAAAAAAAAAAAAAAAAAAAGA+EAAAAAA///////++AAAcAARwBIAAAAAAAAAAAAAAAAAAABJ/+AAAAAAf///////8AAAaAAAgCKAAAAAAAAAAAAAAAAAAAAX//gAAAAAP///////8AAACAAQAAOAAAAAAAAAAAAAAAAAAAAD//gAAAAAH///////8AAACAAIAEEAAAAAAAAAAAAAAAAAAAAD//+AAAAAD/D/////4AAAAAAMAGAAAAAAAAAAAAAAAAAAAAAD///gAAAAAABf////wAAAAABuAeAAAAAAAAAAAAAAAAAAAAAD///gAAAAAAAP////gAAAAAA2A8AAAAAAAAAAAAAAAAAAAAAH///wAAAAAAAP////AAAAAAAeB8AAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAP///+AAAAAAAcH88gAAAAAAAAAAAAAAAAAAAP///4AAAAAAAf///8AAAAAAAOH8AiAAAAAAAAAAAAAAAAAAAf////AAAAAAAf///4AAAAAAAHD5gCIAAAAAAAAAAAAAAAAAAP////8AAAAAAP///wAAAAAAAHh5QzfAQAAAAAAAAAAAAAAAAf/////AAAAAAH///wAAAAAAADgAQA/wQAAAAAAAAAAAAAAAAf/////wAAAAAD///gAAAAAAAAgAAAP5gAAAAAAAAAAAAAAAAP/////wAAAAAD///wAAAAAAAAfAAAH8DAAAAAAAAAAAAAAAAH/////wAAAAAD///gAAAAAAAADwAAPmAQAAAAAAAAAAAAAAAH/////wAAAAAD///wAAAAAAAAAAEAACAAAAAAAAAAAAAAAAAD/////gAAAAAB///wAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAD/////AAAAAAB///wAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAB////+AAAAAAD///wEAAAAAAAAAAPhgAAAAAAAAAAAAAAAAAB////+AAAAAAD///4MAAAAAAAAABPhwAAAAAAAAAAAAAAAAAA////+AAAAAAH///wcAAAAAAAAAH/hwAAQAAAAAAAAAAAAAAAP///+AAAAAAH///h8AAAAAAAAAP/54AAAAAAAAAAAAAAAAAAH///8AAAAAAH//+B8AAAAAAAAAP//4AAACAAAAAAAAAAAAAAD///8AAAAAAD//8A4AAAAAAAAAf//8AAAAAAAAAAAAAAAAAAD///8AAAAAAB//8B4AAAAAAAAD///+ABAAAAAAAAAAAAAAAAD///4AAAAAAB//8BwAAAAAAAAP////AAAAAAAAAAAAAAAAAAD///gAAAAAAA//8BwAAAAAAAAf////gAAAAAAAAAAAAAAAAAD//8AAAAAAAA//8BwAAAAAAAAf////wAAAAAAAAAAAAAAAAAH//4AAAAAAAA//wAAAAAAAAAAf////wAAAAAAAAAAAAAAAAAH//4AAAAAAAA//wAAAAAAAAAAf////4AAAAAAAAAAAAAAAAAH//4AAAAAAAAf/wAAAAAAAAAAf////4AAAAAAAAAAAAAAAAAH//wAAAAAAAAf/gAAAAAAAAAAP////4AAAAAAAAAAAAAAAAAH//wAAAAAAAAP/AAAAAAAAAAAP////wAAAAAAAAAAAAAAAAAH//gAAAAAAAAH+AAAAAAAAAAAH/j//wAAAAAAAAAAAAAAAAAH//AAAAAAAAAH8AAAAAAAAAAAH4A//gAAAAAAAAAAAAAAAAAP/uAAAAAAAAAGAAAAAAAAAAAAPAAv/gAAAAAAAAAAAAAAAAAP/wAAAAAAAAAAAAAAAAAAAAAAAAAH/AAAQAAAAAAAAAAAAAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAD/AAAIAAAAAAAAAAAAAAf/wAAAAAAAAAAAAAAAAAAAAAAAAAB8AAAOAAAAAAAAAAAAAAf8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAf8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAfwAAAAAAAAAAAAAAAAAAAAAAAAAAAOAABgAAAAAAAAAAAAAAPwAAAAAAAAAAAAAAAAAAAAAAAAAAAEAADAAAAAAAAAAAAAAA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAAAA/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAB8AAACAPn8f/zwAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAA///gD////////8AAAAAAAAAAAAAAAAAAF8AAAAAAAAAAAAPP///wP/////////+AAAAAAAAAAAAAAAAAG8AAAAAAAADz///////B///////////8AAAAAAAAAAAAMAAA++AAAAAAH//////////H////////////+AAAAAAAAAAAeAwAD+AAAAAA////////////////////////8AAAAAAApAfAH////+AAAAAA////////////////////////gAAAAAH//////////gAAAAAP///////////////////////+AAAAAAf////////8AAAAAAf////////////////////////+AAAAA///////////AAAHAP//////////////////////////AAAAOA/////////8AAAfgc/////////////////////////4AAAAAAP/////////4PB+AA/////////////////////////wAAAAAH///////////8AfP//////////////////////////8AAAAAH////////////v/////////////////////////////wA98AAf//////////////////////////////////////////8////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////';

  var GW = 288, GH = 144;

  var TILT = 0.41;                     /* ~23.5 deg axial tilt */
  var COST = Math.cos(TILT), SINT = Math.sin(TILT);
  var BUCKETS = 6;
  var SPIN_SPEED = 0.42;               /* radians per second */
  var DRAG_GAIN = 3.2;                 /* radians per canvas width dragged */

  /* Blue ramp, light to dark. Index = citation tier. */
  var TIER_RGB = [
    null,
    [130, 178, 224],
    [90, 150, 207],
    [52, 113, 180],
    [24, 79, 143],
    [8, 42, 99]
  ];

  /* Countries too small to own a dot at 1.25 deg resolution */
  var MICRO = [
    ['SG', 1.3521, 103.8198],
    ['HK', 22.3193, 114.1694],
    ['MO', 22.1987, 113.5439]
  ];

  function tierFor(n) {
    if (n >= 20) return 5;
    if (n >= 8) return 4;
    if (n >= 4) return 3;
    if (n >= 2) return 2;
    return 1;
  }

  /* ---- Unpack the mask into unit-sphere coordinates, once ---- */
  var bin = atob(MASK);
  var cidBytes = atob(CIDS);

  var xs = [], ys = [], zs = [], cs = [];
  var grid = new Uint8Array(GW * GH);
  var cidPtr = 0;

  for (var row = 0; row < GH; row++) {
    var lat = (90 - (row + 0.5) * 180 / GH) * Math.PI / 180;
    var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
    /* Thin out rows near the poles, where equirectangular cells crowd
       together and would otherwise clump into solid caps. */
    var step = cosLat < 0.15 ? 6 : cosLat < 0.35 ? 3 : cosLat < 0.6 ? 2 : 1;
    for (var col = 0; col < GW; col += step) {
      var idx = row * GW + col;
      if (!((bin.charCodeAt(idx >> 3) >> (7 - (idx & 7))) & 1)) continue;
      var cid = cidBytes.charCodeAt(cidPtr++);
      var lon = (-180 + (col + 0.5) * 360 / GW) * Math.PI / 180;
      xs.push(cosLat * Math.sin(lon));
      ys.push(sinLat);
      zs.push(cosLat * Math.cos(lon));
      cs.push(cid);
      grid[idx] = cid;
    }
  }
  var N = xs.length;
  xs = Float32Array.from(xs);
  ys = Float32Array.from(ys);
  zs = Float32Array.from(zs);

  var cidArr = Uint8Array.from(cs);
  var tierOf = new Uint8Array(256);
  for (var ci = 1; ci <= CITED.length; ci++) tierOf[ci] = tierFor(CITED[ci - 1][2]);

  /* Micro-country markers, resolved to their CITED index */
  var micro = [];
  for (var mi = 0; mi < MICRO.length; mi++) {
    for (var cj = 1; cj <= CITED.length; cj++) {
      if (CITED[cj - 1][0] === MICRO[mi][0]) {
        var mlat = MICRO[mi][1] * Math.PI / 180, mlon = MICRO[mi][2] * Math.PI / 180;
        micro.push({
          id: cj,
          x: Math.cos(mlat) * Math.sin(mlon),
          y: Math.sin(mlat),
          z: Math.cos(mlat) * Math.cos(mlon)
        });
      }
    }
  }

  var spin = -1.35;
  var spinVel = 0;
  var dpr = 1, size = 0, R = 0, cx = 0, cy = 0;
  var dragging = false, lastX = 0, raf = null, last = 0;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  /* ---- WebGL dot layer ----------------------------------------------
     The dots are the same data either way. Painting them as GL points
     keeps the per-frame cost flat instead of spiking when the land-heavy
     hemisphere rotates in (the 2D path issues one fillRect per dot).
     If WebGL is missing or fails, everything falls back to the 2D path. */
  var GL_STRIDE = 8;                   /* x, y, size, r, g, b, a, kind */
  var gl = null, glProg = null, glBuf = null, glReady = false, glRes = null;
  var glData = new Float32Array((N + micro.length + 4) * GL_STRIDE);
  var gx = new Float32Array(N), gy = new Float32Array(N);
  var gbucket = new Uint8Array(N);

  function compileShader(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function initGL() {
    if (!glCanvas) return;
    try {
      gl = glCanvas.getContext('webgl', {
        alpha: true, premultipliedAlpha: true,
        antialias: false, depth: false, stencil: false
      });
    } catch (err) {
      gl = null;
    }
    if (!gl) return;

    var vs = compileShader(gl.VERTEX_SHADER, [
      'attribute vec2 aPos;',
      'attribute float aSize;',
      'attribute vec4 aColor;',
      'attribute float aKind;',
      'uniform vec2 uRes;',
      'varying vec4 vColor;',
      'varying float vSize;',
      'varying float vKind;',
      'varying float vSprite;',
      'void main() {',
      '  vec2 clip = vec2(aPos.x / uRes.x * 2.0 - 1.0, 1.0 - aPos.y / uRes.y * 2.0);',
      '  gl_Position = vec4(clip, 0.0, 1.0);',
      /* Point sizes are rounded to whole pixels by the rasteriser, so the
         sprite is made a little larger than the dot and the exact footprint
         is cut out in the fragment shader instead. */
      '  float sprite = aKind > 0.5 ? aSize + 2.0 : ceil(aSize) + 1.0;',
      '  gl_PointSize = sprite;',
      '  vColor = aColor;',
      '  vSize = aSize;',
      '  vKind = aKind;',
      '  vSprite = sprite;',
      '}'
    ].join('\n'));

    /* Dots reproduce the pixel-area coverage of a fractional fillRect.
       Beads are a filled disc with the white rim the 2D path strokes. */
    var fs = compileShader(gl.FRAGMENT_SHADER, [
      'precision mediump float;',
      'varying vec4 vColor;',
      'varying float vSize;',
      'varying float vKind;',
      'varying float vSprite;',
      'void main() {',
      '  vec2 p = (gl_PointCoord - 0.5) * vSprite;',
      '  if (vKind > 0.5) {',
      '    float edge = vSize * 0.5;',
      '    float d = length(p);',
      '    float disc = clamp(edge - d + 0.5, 0.0, 1.0);',
      '    float ring = clamp(d - (edge - 2.0) + 0.5, 0.0, 1.0) * clamp(edge - d + 0.5, 0.0, 1.0);',
      '    float sa = vColor.a * disc;',
      '    float wa = 0.85 * ring;',
      '    float oa = wa + sa * (1.0 - wa);',
      '    vec3 oc = (vec3(1.0) * wa + vColor.rgb * sa * (1.0 - wa)) / max(oa, 0.0001);',
      '    gl_FragColor = vec4(oc * oa, oa);',
      '  } else {',
      '    float h = vSize * 0.5;',
      '    float cx = clamp(min(h, p.x + 0.5) - max(-h, p.x - 0.5), 0.0, 1.0);',
      '    float cy = clamp(min(h, p.y + 0.5) - max(-h, p.y - 0.5), 0.0, 1.0);',
      '    float a = vColor.a * cx * cy;',
      '    gl_FragColor = vec4(vColor.rgb * a, a);',
      '  }',
      '}'
    ].join('\n'));

    if (!vs || !fs) return;
    glProg = gl.createProgram();
    gl.attachShader(glProg, vs);
    gl.attachShader(glProg, fs);
    gl.linkProgram(glProg);
    if (!gl.getProgramParameter(glProg, gl.LINK_STATUS)) {
      glProg = null;
      return;
    }
    gl.useProgram(glProg);

    glBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glBuf);
    gl.bufferData(gl.ARRAY_BUFFER, glData.byteLength, gl.DYNAMIC_DRAW);

    var stride = GL_STRIDE * 4;
    var loc;
    loc = gl.getAttribLocation(glProg, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, stride, 0);
    loc = gl.getAttribLocation(glProg, 'aSize');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, stride, 8);
    loc = gl.getAttribLocation(glProg, 'aColor');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, stride, 12);
    loc = gl.getAttribLocation(glProg, 'aKind');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, stride, 28);
    glRes = gl.getUniformLocation(glProg, 'uRes');

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    /* Shaders emit premultiplied colour, matching the canvas' own blend. */
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    glReady = true;

    glCanvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      glReady = false;
      glCanvas.style.display = 'none';
      draw();
    });
  }

  function resize() {
    var css = canvas.clientWidth;
    if (!css) return;
    /* Always rasterise at 2x: the dot grid is fine enough that a 1x canvas
       renders it as a faint haze on standard displays. */
    dpr = 2;
    size = css;
    canvas.width = Math.round(css * dpr);
    canvas.height = Math.round(css * dpr);
    R = css * 0.5 * 0.82 * dpr;
    cx = cy = css * 0.5 * dpr;
    if (glCanvas) {
      glCanvas.width = canvas.width;
      glCanvas.height = canvas.height;
      if (gl) gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    }
    /* With WebGL the 2D canvas only ever holds the sphere body, so it is
       painted on resize instead of every frame. */
    if (glReady) paintBase();
  }

  function project(x, y, z, a) {
    var ca = Math.cos(a), sa = Math.sin(a);
    var rx = x * ca + z * sa;
    var rz = -x * sa + z * ca;
    return [rx, y * COST - rz * SINT, y * SINT + rz * COST];
  }

  var tip = null, tipOn = false;

  /* Sphere body + atmosphere, drawn once per resize when WebGL is active. */
  function paintBase() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, 'rgba(0,114,222,0.07)');
    g.addColorStop(1, 'rgba(0,114,222,0.02)');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 6.2832);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 6.2832);
    ctx.strokeStyle = 'rgba(0,114,222,0.07)';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();
  }

  /* Land, drawn back-to-front in depth buckets so fillStyle is set a
     handful of times instead of once per dot. Cited countries are
     gathered per citation tier on top of that. */
  function drawDots2D() {
    var lists = [];
    for (var b = 0; b < BUCKETS; b++) {
      lists.push([]);
      for (var k = 0; k < 6; k++) lists[b].push([]);
    }
    var ca = Math.cos(spin), sa = Math.sin(spin);
    for (var i = 0; i < N; i++) {
      var x = xs[i], y = ys[i], z = zs[i];
      var rx = x * ca + z * sa;
      var rz = -x * sa + z * ca;
      var fy = y * COST - rz * SINT;
      var fz = y * SINT + rz * COST;
      if (fz <= 0.02) continue;
      var bi = Math.min(BUCKETS - 1, (fz * BUCKETS) | 0);
      lists[bi][tierOf[cidArr[i]]].push(cx + rx * R, cy - fy * R);
    }
    /* Dot size tracks the widget size so a smaller globe keeps the same
       granular look instead of turning into a solid mass. */
    var dotScale = dpr * (size / 330);
    for (var b2 = 0; b2 < BUCKETS; b2++) {
      var t = (b2 + 1) / BUCKETS;
      var s = (0.9 + t * 0.9) * dotScale;
      for (var k2 = 0; k2 < 6; k2++) {
        var pts = lists[b2][k2];
        if (!pts.length) continue;
        if (k2 === 0) {
          /* Uncited land is kept as a quiet ghost so the cited countries read first */
          ctx.fillStyle = 'rgba(122,122,122,' + (0.08 + t * 0.22).toFixed(3) + ')';
        } else {
          var rgb = TIER_RGB[Math.min(k2, 5)];
          ctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (0.55 + t * 0.45).toFixed(3) + ')';
        }
        for (var q = 0; q < pts.length; q += 2) ctx.fillRect(pts[q], pts[q + 1], s, s);
      }
    }
  }

  /* Micro-countries: a slightly larger bead so they stay visible */
  function drawBeads2D() {
    for (var m = 0; m < micro.length; m++) {
      var mp = micro[m];
      var pr = project(mp.x, mp.y, mp.z, spin);
      if (pr[2] <= 0.02) continue;
      var mx = cx + pr[0] * R, my = cy - pr[1] * R;
      var mrgb = TIER_RGB[tierOf[mp.id]];
      var depth = Math.min(1, Math.max(0, pr[2]));
      ctx.beginPath();
      ctx.arc(mx, my, 3 * dpr * (size / 330), 0, 6.2832);
      ctx.fillStyle = 'rgba(' + mrgb[0] + ',' + mrgb[1] + ',' + mrgb[2] + ',' + (0.45 + depth * 0.55).toFixed(2) + ')';
      ctx.fill();
      ctx.lineWidth = 1 * dpr;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.stroke();
    }
  }

  function drawGL() {
    if (!glReady) return;
    var ca = Math.cos(spin), sa = Math.sin(spin);
    var dotScale = dpr * (size / 330);
    var i, b;
    for (i = 0; i < N; i++) {
      var x = xs[i], y = ys[i], z = zs[i];
      var rx = x * ca + z * sa;
      var rz = -x * sa + z * ca;
      var fz = y * SINT + rz * COST;
      if (fz <= 0.02) {
        gbucket[i] = 255;
        continue;
      }
      gx[i] = cx + rx * R;
      gy[i] = cy - (y * COST - rz * SINT) * R;
      gbucket[i] = Math.min(BUCKETS - 1, (fz * BUCKETS) | 0);
    }

    var o = 0;
    for (b = 0; b < BUCKETS; b++) {
      var t = (b + 1) / BUCKETS;
      var s = (0.9 + t * 0.9) * dotScale;
      for (i = 0; i < N; i++) {
        if (gbucket[i] !== b) continue;
        var tier = tierOf[cidArr[i]];
        var r, g2, bl, a;
        if (tier === 0) {
          r = 122; g2 = 122; bl = 122;
          a = 0.08 + t * 0.22;
        } else {
          var rgb = TIER_RGB[Math.min(tier, 5)];
          r = rgb[0]; g2 = rgb[1]; bl = rgb[2];
          a = 0.55 + t * 0.45;
        }
        glData[o++] = gx[i] + s * 0.5;
        glData[o++] = gy[i] + s * 0.5;
        glData[o++] = s;
        glData[o++] = r / 255;
        glData[o++] = g2 / 255;
        glData[o++] = bl / 255;
        glData[o++] = a;
        glData[o++] = 0;
      }
    }

    /* Sprite covers the fill radius plus the 1 device px the 2D stroke
       adds outside it. */
    var beadR = 3 * dpr * (size / 330);
    var beadS = 2 * (beadR + dpr * 0.5);
    for (var m = 0; m < micro.length; m++) {
      var mp = micro[m];
      var pr = project(mp.x, mp.y, mp.z, spin);
      if (pr[2] <= 0.02) continue;
      var mrgb = TIER_RGB[tierOf[mp.id]];
      var depth = Math.min(1, Math.max(0, pr[2]));
      glData[o++] = cx + pr[0] * R;
      glData[o++] = cy - pr[1] * R;
      glData[o++] = beadS;
      glData[o++] = mrgb[0] / 255;
      glData[o++] = mrgb[1] / 255;
      glData[o++] = mrgb[2] / 255;
      glData[o++] = 0.45 + depth * 0.55;
      glData[o++] = 1;
    }

    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(glProg);
    gl.uniform2f(glRes, glCanvas.width, glCanvas.height);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, glData.subarray(0, o));
    gl.drawArrays(gl.POINTS, 0, o / GL_STRIDE);
  }

  function draw() {
    if (!size) return;
    if (glReady) {
      drawGL();
      return;
    }
    paintBase();
    drawDots2D();
    drawBeads2D();
  }

  /* ---- Hover detail ---- */
  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.className = 'globe-tip';
    var wrap = canvas.parentNode;
    wrap.appendChild(tip);
    return tip;
  }

  function showTip(px, py, id) {
    var el = ensureTip();
    var entry = CITED[id - 1];
    el.textContent = entry[1] + ' \u00b7 ' + entry[2] + (entry[2] === 1 ? ' citing paper' : ' citing papers');
    el.style.left = (canvas.offsetLeft + px) + 'px';
    el.style.top = (canvas.offsetTop + py) + 'px';
    el.classList.add('is-on');
    tipOn = true;
  }

  function hideTip() {
    if (!tipOn) return;
    if (tip) tip.classList.remove('is-on');
    tipOn = false;
  }

  function hitTest(px, py) {
    var half = size / 2, rad = size * 0.41;
    var nx = (px - half) / rad;
    var ny = (half - py) / rad;
    var r2 = nx * nx + ny * ny;
    if (r2 > 1) return 0;

    /* Micro-country beads sit on top of the land, so try them first */
    var best = 0, bestD = 36;
    for (var m = 0; m < micro.length; m++) {
      var mp = micro[m];
      var pr = project(mp.x, mp.y, mp.z, spin);
      if (pr[2] <= 0.02) continue;
      var dx = (half + pr[0] * rad) - px;
      var dy = (half - pr[1] * rad) - py;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = mp.id; }
    }
    if (best) return best;

    var nz = Math.sqrt(1 - r2);
    var y = ny * COST + nz * SINT;
    var rz = -ny * SINT + nz * COST;
    var ca = Math.cos(spin), sa = Math.sin(spin);
    var x = nx * ca - rz * sa;
    var z = nx * sa + rz * ca;

    var lat2 = Math.asin(Math.max(-1, Math.min(1, y)));
    var lon2 = Math.atan2(x, z);
    var col2 = Math.floor((lon2 + Math.PI) / (2 * Math.PI) * GW);
    var row2 = Math.floor((Math.PI / 2 - lat2) / Math.PI * GH);
    if (col2 < 0) col2 = 0; else if (col2 >= GW) col2 = GW - 1;
    if (row2 < 0) row2 = 0; else if (row2 >= GH) row2 = GH - 1;
    return grid[row2 * GW + col2];
  }

  function hover(e) {
    if (dragging) return;
    if (e.pointerType && e.pointerType !== 'mouse') return;
    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left;
    var py = e.clientY - rect.top;
    var id = hitTest(px, py);
    if (id) showTip(px, py, id); else hideTip();
  }

  canvas.addEventListener('pointermove', hover);
  canvas.addEventListener('pointerleave', hideTip);

  /* Drag to spin */
  function down(e) {
    dragging = true;
    spinVel = 0;
    lastX = e.clientX;
    canvas.classList.add('is-dragging');
    hideTip();
    /* Keep a drag from selecting the surrounding text */
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    if (canvas.setPointerCapture && e.pointerId !== undefined) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    }
    start();
  }

  function move(e) {
    if (!dragging) return;
    var d = (e.clientX - lastX) / Math.max(size, 1) * DRAG_GAIN;
    spin += d;
    spinVel = d * 8;
    lastX = e.clientX;
    if (e.cancelable) e.preventDefault();
  }

  function up(e) {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('is-dragging');
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    if (canvas.releasePointerCapture && e && e.pointerId !== undefined) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    start();
  }

  function tick(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    if (!dragging && !reduce.matches) {
      spin += (SPIN_SPEED + spinVel) * dt;
      spinVel *= Math.pow(0.94, dt * 60);
    }
    draw();
    /* With reduced motion there is nothing left to animate: stop the loop
       once the throw has decayed and draw only on interaction or resize. */
    if (reduce.matches && !dragging && Math.abs(spinVel) < 0.01) {
      raf = null;
      last = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (raf === null) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  function stop() {
    if (raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
      last = 0;
    }
  }

  if (window.PointerEvent) {
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  } else {
    /* Fallback for browsers without Pointer Events */
    canvas.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', down, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      if (!dragging || !e.touches.length) return;
      move({ clientX: e.touches[0].clientX, preventDefault: function () { e.preventDefault(); }, cancelable: e.cancelable });
    }, { passive: false });
    window.addEventListener('touchend', up);
  }

  /* Releasing the pointer outside the window would otherwise leave the
     globe stuck in drag mode. */
  window.addEventListener('blur', up);

  window.addEventListener('resize', function () { resize(); draw(); });

  if (window.ResizeObserver) {
    new ResizeObserver(function () { resize(); draw(); }).observe(canvas);
  }

  var countEl = document.getElementById('globe-count');
  if (countEl) countEl.textContent = CITED.length;

  initGL();
  resize();
  draw();

  if ('IntersectionObserver' in window) {
    /* Skip the animation frames while the globe is scrolled out of view. */
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) start(); else stop();
    }, { rootMargin: '150px' }).observe(canvas);
  } else {
    start();
  }
})();
