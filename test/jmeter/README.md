# JMeter Testing files

Check:

* https://jmeter.apache.org/usermanual/index.html
* https://jmeter.apache.org/usermanual/best-practices.html

#### Load example:

       jmeter -t test/jmeter/base.jmx

No-UI mode:

    jmeter -n -t  test/jmeter/base.jmx -l /tmp/base_result.jtl -e

### Testing

Create files for API & case testing

### Guideline

* Create .csv files or `User Defined Variables` sections in your test
* Use DEV envs for testing
* Add information about how to run your test in this file ( or file in the same dir as you test, for example: testCase1.jmx & testCase1.md)

## Test cases

#### base.jmx
* Basic api test,
* Must always work in the api
* No configs or api state required

#### testEnpointStressTest.jmx
* Demonstration test
* Remove test after clone
* No configs or api state required
