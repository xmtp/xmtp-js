describe('scratch', () => {
  it('blows', () => {
    const f = () => {
      throw { mud: 7 }
    }
    expect(f).toThrow(Object)
  })
})
