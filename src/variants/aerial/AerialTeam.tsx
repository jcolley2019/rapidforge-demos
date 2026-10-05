import { content } from '../../content/content'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from './Reveal'

const PORTRAIT_TONES = [
  { from: '#26375a', to: '#131c2b' },
  { from: '#1f2e4a', to: '#0f1726' },
  { from: '#22334f', to: '#101827' },
  { from: '#1c2a44', to: '#0b1120' },
]

export default function AerialTeam() {
  return (
    <section className="ae-team" id="team" aria-label="Our team">
      <div className="ae-wrap">
        <Reveal>
          <p className="ae-eyebrow">The team</p>
          <h2 className="ae-team-title">The surveyors behind the instruments</h2>
        </Reveal>
        <div className="ae-team-grid">
          {content.team.map((member, i) => {
            const tone = PORTRAIT_TONES[i % PORTRAIT_TONES.length]
            return (
              <Reveal key={member.name} stagger={i}>
                <div className="ae-member-portrait">
                  <PlaceholderImage
                    aspectRatio="4 / 5"
                    gradientFrom={tone.from}
                    gradientTo={tone.to}
                    lineColor="#aab4c5"
                    lineOpacity={0.3}
                    seed={70 + i}
                    label="Portrait"
                    labelColor="#7e8aa0"
                  />
                </div>
                <h3 className="ae-member-name">{member.name}</h3>
                <p className="ae-member-credential">{member.credential}</p>
                <p className="ae-member-role">{member.role}</p>
                <p className="ae-member-blurb">{member.blurb}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
