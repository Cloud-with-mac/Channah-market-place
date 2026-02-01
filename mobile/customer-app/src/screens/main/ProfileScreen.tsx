import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../../store/authStore';
import { profileAPI } from '../../../../shared/api/customer-api';
import { customerApiClient } from '../../../../shared/api/client';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => { await logout(); },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await customerApiClient.put('/users/me', {
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      if (setUser) setUser(response.data);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      setChangingPassword(true);
      await profileAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const menuItems = [
    { icon: 'receipt-outline', title: 'Orders', screen: 'Orders' },
    { icon: 'heart-outline', title: 'Wishlist', screen: 'Wishlist' },
    { icon: 'location-outline', title: 'Addresses', screen: 'Addresses' },
    { icon: 'notifications-outline', title: 'Notifications', screen: 'Notifications' },
    { icon: 'chatbubbles-outline', title: 'Messages', screen: 'Chat' },
  ];

  const moreItems = [
    { icon: 'flame-outline', title: 'Hot Deals', screen: 'Deals' },
    { icon: 'trophy-outline', title: 'Best Sellers', screen: 'BestSellers' },
    { icon: 'sparkles-outline', title: 'New Arrivals', screen: 'NewArrivals' },
  ];

  const infoItems = [
    { icon: 'information-circle-outline', title: 'About', screen: 'About' },
    { icon: 'help-circle-outline', title: 'Help & FAQ', screen: 'Help' },
    { icon: 'mail-outline', title: 'Contact Us', screen: 'Contact' },
    { icon: 'document-text-outline', title: 'Terms of Service', screen: 'Terms' },
    { icon: 'shield-outline', title: 'Privacy Policy', screen: 'Privacy' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
          </Text>
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
              />
              <TextInput
                style={styles.editInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
              />
            </View>
            <TextInput
              style={[styles.editInput, { width: '100%' }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={() => {
                  setEditing(false);
                  setFirstName(user?.first_name || '');
                  setLastName(user?.last_name || '');
                  setPhone(user?.phone || '');
                }}
              >
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.name}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                <Icon name="create-outline" size={16} color="#3b82f6" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.passwordButton} onPress={() => setShowPasswordModal(true)}>
                <Icon name="lock-closed-outline" size={16} color="#6b7280" />
                <Text style={styles.passwordButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => item.screen && navigation.navigate(item.screen)}
          >
            <Icon name={item.icon} size={24} color="#6b7280" />
            <Text style={styles.menuText}>{item.title}</Text>
            <Icon name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Discover Section */}
      <Text style={styles.sectionLabel}>Discover</Text>
      <View style={styles.menu}>
        {moreItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Icon name={item.icon} size={24} color="#6b7280" />
            <Text style={styles.menuText}>{item.title}</Text>
            <Icon name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Info Section */}
      <Text style={styles.sectionLabel}>Information</Text>
      <View style={styles.menu}>
        {infoItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Icon name={item.icon} size={24} color="#6b7280" />
            <Text style={styles.menuText}>{item.title}</Text>
            <Icon name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.pwField}>
              <TextInput
                style={styles.pwInput}
                placeholder="Current Password"
                secureTextEntry={!showCurrentPw}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)}>
                <Icon name={showCurrentPw ? 'eye-off' : 'eye'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.pwField}>
              <TextInput
                style={styles.pwInput}
                placeholder="New Password (min 8 chars)"
                secureTextEntry={!showNewPw}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}>
                <Icon name={showNewPw ? 'eye-off' : 'eye'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.pwField, styles.pwInput, { flex: 0 }]}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={[styles.changePwBtn, changingPassword && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.changePwBtnText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#fff', padding: 24, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  phone: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  editButton: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#eff6ff',
  },
  editButtonText: { fontSize: 13, color: '#3b82f6', fontWeight: '600', marginLeft: 4 },
  passwordButton: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#f3f4f6',
  },
  passwordButtonText: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginLeft: 4 },
  editForm: { width: '100%', alignItems: 'center', marginTop: 8 },
  editRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 8 },
  editInput: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1f2937',
  },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cancelEditBtn: {
    paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  cancelEditText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#3b82f6' },
  saveBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase',
    letterSpacing: 0.5, marginTop: 16, marginBottom: 4, marginLeft: 16,
  },
  menu: { backgroundColor: '#fff' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  menuText: { flex: 1, marginLeft: 16, fontSize: 16, color: '#1f2937' },
  logoutButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', marginTop: 16, marginBottom: 32, padding: 16,
    borderRadius: 8, marginHorizontal: 16, borderWidth: 1, borderColor: '#fecaca',
  },
  logoutText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#ef4444' },
  // Password Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  pwField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6',
    borderRadius: 8, paddingHorizontal: 12, marginBottom: 12,
  },
  pwInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1f2937' },
  changePwBtn: {
    backgroundColor: '#3b82f6', borderRadius: 8, padding: 14,
    alignItems: 'center', marginTop: 8,
  },
  changePwBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
