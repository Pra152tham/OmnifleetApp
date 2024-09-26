
  const errorCodes = {
    607: "Pedestrian Collision Warning-Mandatory",
    601: "Forward Collision Warning-Mandatory",
    513: "Camera Obstruction",
    619: "Drowsiness Level 3",
    618: "Drowsiness Level 2",
    618: "Drowsiness Level 1",
    606: "Pedestrian Collision Warning-Preliminary",
    600: "Forward Collision Warning-Preliminary",
    621: "Phone Usage",
    603: "Left Lane Departure Warning",
    603: "Right Lane Departure Warning",
    625: "Distraction Warning",
    609: "Over Speeding",
    610: "Continuous Driving",
    612: "Night Driving",
    623: "Smoking",
    638: "Yawning",
    613: "Harsh Acceleration",
    615: "Harsh Turning",
    614: "Harsh Braking",
    639: "Seatbelt Warning",
    599: "Left Cross Traffic Alert",
    598: "Right Cross Traffic Alert",
    597: "Rear Left Cross Traffic Alert",
    596: "Rear Right Cross Traffic Alert",
    595: "Left Blind Spot",
    594: "Right Blind Spot",
    637: "Sudden Stoppage",
    640: "Vehicle Idling",
    611: "SOS",
    641: "Regular Interval Video",
    617: "Regular Snapshot",
  };


const[Vehiclenumber1 , setVehiclenumber1]= useState('all');

const [searchText1, setSearchText1] = useState('');
const [filteredNumbers1, setFilteredNumbers1] = useState([]);
const [Date2, setDate2] = useState(new Date());
const [dropdownVisible1, setDropdownVisible1] = useState(false);

const [registrationNumbers1, setRegistrationNumbers1] = useState([]);

const [showDatePicker2, setShowDatePicker2] = useState(false);

const [modalVisible, setModalVisible] = useState(false);  // State for modal visibility

const [searchQuery2, setSearchQuery2] = useState('');


const [reportsData2, setReportsData2] = useState([]);


const [menuVisible1, setMenuVisible1] = useState(false);

const [selectstatus, setselectstatus]= useState('DSM_AM');

const[errorcodenumber, seterrorcodenumber]= useState('0');

const errorcodePress = (item)=>{
    if(item =='Select Warning Type'){
        seterrorcodenumber(0);
        setMenuVisible1(false)
    }
    else{
        seterrorcodenumber(item);
        setMenuVisible1(false)
    }
}




const handleStatusPress = (groupName) => {
    setselectstatus(groupName);
    
    setMenuVisible(false);
    // Optionally refetch or filter data based on the selected group
  };


useEffect(() => {
    fetchReportsData2();
}, [Date2]);

const fetchReportsData2 = async () => {
    
};

useEffect(() => {

}, [searchQuery2, reportsData2]);


const fetchRegistrationNumbers1 = async () => {
    try {
      const response = await fetch(`https://www.novusomnifleet.com/hitech-api/vehicle/get-all-vehicle-by-fleet-manager-id/${userId}`);
      const data = await response.json();
      if (data.status === 200) {
        const registrations = data.data.map(vehicle => vehicle.registrationNo);
        setRegistrationNumbers1(registrations);
        setFilteredNumbers1(registrations); // Initialize with full list
      } else {
        console.error('Failed to fetch vehicle data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
    }
  };
  
  useEffect(() => {
    fetchRegistrationNumbers1();
  }, [userId]);

const handleSearchChange1 = (text) => {
    setSearchText1(text);
        // Filter registration numbers based on search input
        const filtered = registrationNumbers1.filter((reg) =>
          reg.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredNumbers1(filtered);
        setDropdownVisible1(true); // Show dropdown when searching
  };


const showDatePicker22 = (type) => {
  
    setShowDatePicker2(true);
  };

const onDateChange2 = (event, selectedDate, type) => {
    const currentDate = selectedDate || Date2;
  
        setShowDatePicker2(Platform.OS === 'ios');
        setDate2(currentDate);
  };


{selectedStatus==='Alarm Video Play Back' && 
    <View style = {styles.container2}>
    <View style={styles.datePickers}>
            <View style={styles.datePickerContainer}>
                <Text style={styles.datePickerLabel}>Select Date:</Text>
                <TouchableOpacity onPress={() => showDatePicker22()}>
                    <Text style={styles.datePickerText}>{moment(Date2).format('YYYY-MM-DD')}</Text>
                </TouchableOpacity>
            </View>
        </View>
        {showDatePicker2 && (
          <DateTimePicker
              value={Date2}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => onDateChange2(event, selectedDate)}
          />
      )}
      <View style= {styles.drop}>
        <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.groupSelector}>
                    <Text style={styles.selectedGroupText}>{selectstatus}</Text>
                    <Icon name="angle-down" size={16} color="#000" style= {styles.icon1}/>
                </TouchableOpacity>
            }>
            <Menu.Item onPress={() => handleStatusPress('DSM_AM')} title="DSM_AM" />
            <Menu.Item onPress={() => handleStatusPress('DSM')} title="DSM" />
            <Menu.Item onPress={() => handleStatusPress('FCW')} title="FCW" />
        </Menu>
        </View>
        

    <View style={styles.container1}>
      <TextInput
          style={styles.searchInput}
          placeholder="Search Registration Number"
          value={searchText1}
          onChangeText={handleSearchChange1}
      />
      {dropdownVisible1 && filteredNumbers1.length > 0 && (
          <View style={styles.dropdownList}>
          <FlatList
              scrollEnabled={false}
              data={filteredNumbers1}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
              <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                  setSearchText1(item);
                  setDropdownVisible1(false); // Hide dropdown after selection
                  setVehiclenumber1(item);
                  }}
              >   
                  
                  <Text style={styles.itemText}>{item}</Text>
                  
              </TouchableOpacity>
              )}
          />
          </View>
      )}
      </View>
      
      <View style= {styles.drop}>

      <Menu
          visible={menuVisible1}
          onDismiss={() => setMenuVisible1(false)}
          anchor={
              <TouchableOpacity onPress={() => setMenuVisible1(true)} style={styles.groupSelector}>
                  <Text style={styles.selectedGroupText}>{(errorcodenumber!=0?errorCodes[errorcodenumber]:'Select Warning Type')}</Text>
                  <Icon name="angle-down" size={16} color="#000" style= {styles.icon1}/>
              </TouchableOpacity>
          }>
          <Menu.Item onPress={() => errorcodePress('Select Warning Type')} title="Select Warning Type" />
          {Object.entries(errorCodes).map(([code, description]) => (
              <Menu.Item
                  key={code}
                  onPress={() => errorcodePress(code)}
                  title={`${description}`}
              />
          ))}
      </Menu>
      </View>

      
      <TouchableOpacity style={styles.searchButton} onPress={fetchReportsData2}>
          <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
      <TextInput
          style={styles.searchInput1}
          placeholder="Search..."
          value={searchQuery2}
          onChangeText={setSearchQuery2}
      />
      </View>
      }
