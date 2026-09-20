export type TAdminBot = {
    id: string;
    name: string;
    description: string;
    category: string;
    risk: 'Low' | 'Medium' | 'High';
    color: string;
    icon: string;
    xml: string;
};

const makeXml = (name: string) => `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade_definition" deletable="false" x="30" y="10">
    <statement name="TRADE_OPTIONS">
      <block type="trade_definition_tradeoptions">
        <field name="TRADE_TYPE_LIST">callput</field>
        <field name="TYPE_LIST">CALL</field>
        <statement name="DURATION">
          <block type="trade_definition_tourduration">
            <field name="DURATION_LIST">t</field>
            <value name="DURATION">
              <shadow type="math_number"><field name="NUM">5</field></shadow>
            </value>
          </block>
        </statement>
        <statement name="STAKE">
          <block type="trade_definition_tourstart">
            <field name="CURRENCY_LIST">USD</field>
            <value name="AMOUNT">
              <shadow type="math_number"><field name="NUM">1</field></shadow>
            </value>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

export const ADMIN_BOTS: TAdminBot[] = [
    {
        id: 'martingale-rise-fall',
        name: 'Martingale Rise/Fall',
        description:
            'Classic Martingale strategy on Rise/Fall contracts. Doubles stake after each loss to recover with one win.',
        category: 'Martingale',
        risk: 'High',
        color: '#e74c3c',
        icon: '📈',
        xml: makeXml('Martingale Rise/Fall'),
    },
    {
        id: 'dalembert-digits',
        name: "D'Alembert Digits",
        description:
            "Uses D'Alembert progression on Digits contracts. Increases stake by 1 unit after loss, decreases after win.",
        category: "D'Alembert",
        risk: 'Medium',
        color: '#3498db',
        icon: '🔢',
        xml: makeXml("D'Alembert Digits"),
    },
    {
        id: 'oscars-grind',
        name: "Oscar's Grind",
        description:
            "Oscar's Grind is a low-risk strategy aiming for slow, steady profit accumulation on even-money bets.",
        category: 'Conservative',
        risk: 'Low',
        color: '#2ecc71',
        icon: '🎯',
        xml: makeXml("Oscar's Grind"),
    },
    {
        id: 'reverse-martingale',
        name: 'Reverse Martingale',
        description:
            'Anti-Martingale: doubles stake after each win instead of loss. Maximizes winning streaks safely.',
        category: 'Anti-Martingale',
        risk: 'Medium',
        color: '#9b59b6',
        icon: '🔄',
        xml: makeXml('Reverse Martingale'),
    },
    {
        id: 'volatility-scalper',
        name: 'Volatility Scalper',
        description:
            'Fast-paced scalping bot for Volatility indices. Uses short tick durations for rapid trade cycles.',
        category: 'Scalping',
        risk: 'High',
        color: '#f39c12',
        icon: '⚡',
        xml: makeXml('Volatility Scalper'),
    },
    {
        id: 'safe-accumulator',
        name: 'Safe Accumulator',
        description:
            'Conservative flat-stake bot on Accumulators. No stake progression — pure patience and discipline.',
        category: 'Conservative',
        risk: 'Low',
        color: '#1abc9c',
        icon: '🛡️',
        xml: makeXml('Safe Accumulator'),
    },
];
