# Commercial mini apps: backlog

Built and simulated (in `features.js`): Race Clock, Finisher Call-out, Results Board, Cheer Zone, Mile Marker, Run Club,
Tap List, Trivia Night, Last Call, Class Spots, Chair Wait, Driver Pickup, plus five room profiles.

Not built yet. Each line: what it shows · who pays · where the data comes from.

## Races and events
- **Bib lookup kiosk**: runner types a bib on a phone, the Panel shows their splits and finish photo link · timing companies · results API
- **Packet pickup**: which table for which bib range, line length by presence · race organisers · registration export
- **Sponsor mile**: sponsor logo line and a cheer, on a battery stand at a mile marker · sponsors pay the organiser · static
- **Course alerts**: course closed, water stop out, heat flag (green/yellow/red/black) · organisers, medical tent · manual + weather
- **Awards countdown**: minutes to the age-group ceremony and where · organisers · schedule
- **Charity tally**: dollars raised toward the goal, climbing live · charity runs · donation platform
- **Tournament bracket** (cornhole, softball, esports): current match, next up, field number · rec leagues, venues · bracket app

## Food and drink
- **Kitchen ticket times**: average ticket time, late tickets in red (back of house) · restaurants · Square/Toast KDS
- **Reservation board**: next tables, who's late, walk-in wait · restaurants · Resy/OpenTable/Square
- **Brew day / new release**: release countdown and can count left · breweries · manual
- **Patio open**: open/closed by the weather sense, heaters on · bars, cafes · climate sense + weather
- **Live music tonight**: who's playing, set times · venues · calendar

## Retail and services
- **Flash sale**: a 30-minute deal with a countdown, triggered from the POS · shops · Square
- **Loyalty milestone**: "500th customer today" style moments · shops · POS count
- **Car wash bays / oil change**: bay status and wait · auto services · manual or sensor
- **Pharmacy / pickup locker ready**: order numbers ready · pharmacies, lockers · order system
- **Laundromat machines**: free washers and dryers, minutes left · laundromats · machine telemetry
- **Dog park / daycare**: how many dogs in, quiet hours · pet businesses · door count

## Offices and lobbies
- **Room booking**: room free/busy and next meeting · offices, coworking · Google/Microsoft calendar
- **Visitor welcome**: "Welcome, Acme team" for scheduled guests · offices, venues · calendar
- **Goal board**: sales or donation goal for the month, celebrations on a win · sales floors · CRM

## Firmware notes
- Concept apps here need porting to C++. Add `$ # @ &` to the firmware fonts first (bitmaps in features.js).
- Data feeds named above each need a hub-side adapter; the hub sends the screens text and numbers only.
